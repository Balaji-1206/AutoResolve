"""
LangGraph Orchestration Engine for AutoResolve AI.

Coordinates the multi-agent investigation pipeline combining:
1. Pre-execution safety and adversarial attack interception
2. Entity extraction and identifier resolution
3. Multi-source evidence gathering (RAG knowledge base + Tool Service databases)
4. Factual conflict detection between customer statements and operational state
5. Grounded LLM reasoning synthesis
6. Authoritative deterministic business rules enforcement
7. Structured response finalization with read-only invariant guarantees
"""

from datetime import datetime
import time
from typing import Any, Dict, Optional
from langgraph.graph import StateGraph, START, END
from langgraph.graph.state import CompiledStateGraph
from langgraph.types import interrupt

from app.clients.rag_client import RAGClient
from app.clients.tool_client import ToolClient
from app.models.resolution import (
    BusinessDecision,
    InvestigationRequest,
    InvestigationResponse,
    InvestigationStatus,
    OperationalEvidence,
)
from app.workflows.evidence import CollectedEvidence, EvidenceCollector
from app.workflows.extractor import extract_identifiers
from app.workflows.reasoning import QwenReasoner
from app.workflows.rules import evaluate_order_rules
from app.workflows.safety import check_evidence_conflicts, detect_adversarial_patterns
from app.workflows.state import InvestigationState


def create_resolution_graph(
    rag_client: RAGClient,
    tool_client: ToolClient,
    reasoner: Optional[QwenReasoner] = None,
    checkpointer: Any = None,
) -> CompiledStateGraph:
    """
    Constructs and compiles the AutoResolve LangGraph investigation pipeline.
    """
    evidence_collector = EvidenceCollector(rag_client=rag_client, tool_client=tool_client)
    llm_reasoner = reasoner or QwenReasoner()

    # -------------------------------------------------------------------------
    # Node 1: Safety Guard (Adversarial Defense)
    # -------------------------------------------------------------------------
    async def safety_check_node(state: InvestigationState) -> Dict[str, Any]:
        """
        Scans ticket text for prompt injection, jailbreaks, and privilege escalation.
        Runs in sub-millisecond time before downstream network calls.
        """
        threats = detect_adversarial_patterns(state.get("ticket_text", ""))
        if threats:
            return {
                "is_safe": False,
                "safety_threats": threats,
            }
        return {
            "is_safe": True,
            "safety_threats": [],
        }

    # -------------------------------------------------------------------------
    # Node 2: Adversarial Escalation (Early Exit)
    # -------------------------------------------------------------------------
    async def escalate_threat_node(state: InvestigationState) -> Dict[str, Any]:
        """
        Terminal node for adversarial attacks. Creates early security escalation
        without executing RAG retrieval, operational tools, or LLM reasoning.
        """
        dt = round((time.time() - state.get("start_time", time.time())) * 1000, 2)
        threats = state.get("safety_threats", [])

        response = InvestigationResponse(
            ticket_id=state.get("ticket_id"),
            status=InvestigationStatus.COMPLETED,
            decision=BusinessDecision.NEEDS_HUMAN_REVIEW,
            summary="Your inquiry has been routed to a senior operations supervisor for manual review.",
            reasoning_summary="Security alert: Unauthorized system override or administrative privilege claim detected in ticket text.",
            requires_human_review=True,
            review_reasons=threats,
            actions_taken=[],
            duration_ms=dt,
        )

        return {
            "status": InvestigationStatus.COMPLETED,
            "decision": BusinessDecision.NEEDS_HUMAN_REVIEW,
            "requires_human_review": True,
            "review_reasons": threats,
            "summary": response.summary,
            "reasoning_summary": response.reasoning_summary,
            "duration_ms": dt,
            "final_response": response,
        }

    # -------------------------------------------------------------------------
    # Node 3: Entity Extraction
    # -------------------------------------------------------------------------
    async def extract_entities_node(state: InvestigationState) -> Dict[str, Any]:
        """
        Extracts business identifiers (orders, customers, payments, refunds)
        from natural language ticket text using canonical AcmeCommerce regex patterns.
        Explicit inbound fields take precedence over extracted regex matches.
        """
        extracted = extract_identifiers(state.get("ticket_text", ""))
        return {
            "extracted_entities": extracted,
            "order_id": state.get("order_id") or extracted.get("order_id"),
            "customer_id": state.get("customer_id") or extracted.get("customer_id"),
            "payment_id": state.get("payment_id") or extracted.get("payment_id"),
            "refund_id": state.get("refund_id") or extracted.get("refund_id"),
            "ticket_id": state.get("ticket_id") or extracted.get("ticket_id"),
        }

    # -------------------------------------------------------------------------
    # Node 4: Evidence Collection (RAG + Operational Tools + Conflict Detection)
    # -------------------------------------------------------------------------
    async def collect_evidence_node(state: InvestigationState) -> Dict[str, Any]:
        """
        Executes parallel policy retrieval and operational database lookups,
        traverses relational entities (Order -> Customer + Payment), and
        checks for factual contradictions between customer claims and operational state.
        """
        req = InvestigationRequest(
            ticket_text=state.get("ticket_text", ""),
            ticket_id=state.get("ticket_id"),
            order_id=state.get("order_id"),
            customer_id=state.get("customer_id"),
            payment_id=state.get("payment_id"),
            refund_id=state.get("refund_id"),
        )

        collected = await evidence_collector.collect_evidence(req)

        conflicts = check_evidence_conflicts(
            state.get("ticket_text", ""),
            collected.operational_evidence.order,
        )

        updates: Dict[str, Any] = {
            "policy_evidence": collected.policy_evidence,
            "operational_evidence": collected.operational_evidence,
            "missing_information": collected.missing_information,
            "errors": collected.errors,
        }

        if conflicts:
            updates["conflicts"] = conflicts
            updates["requires_human_review"] = True
            updates["review_reasons"] = conflicts

        return updates

    # -------------------------------------------------------------------------
    # Node 5: Probabilistic Reasoning (Qwen3 LLM)
    # -------------------------------------------------------------------------
    async def reason_over_evidence_node(state: InvestigationState) -> Dict[str, Any]:
        """
        Synthesizes policy citations and operational facts via Qwen3 prompt inference.
        Deterministic check intercepts missing order ID early.
        """
        missing_info = state.get("missing_information", [])
        if any("Order identifier" in m for m in missing_info):
            return {
                "decision": BusinessDecision.NEEDS_MORE_INFORMATION,
                "summary": "Please provide your unique Order ID (format: ORD-XXXX) so we can review your request.",
                "reasoning_summary": "No valid order identifier was provided in the ticket or request parameters.",
            }

        evidence = CollectedEvidence(
            ticket_id=state.get("ticket_id"),
            policy_evidence=state.get("policy_evidence", []),
            operational_evidence=state.get("operational_evidence", OperationalEvidence()),
            missing_information=missing_info,
            errors=state.get("errors", []),
        )

        llm_decision, summary, reasoning_summary, llm_error = await llm_reasoner.synthesize(
            evidence=evidence,
            customer_text=state.get("ticket_text", ""),
        )

        updates: Dict[str, Any] = {
            "llm_decision": llm_decision,
            "summary": summary,
            "reasoning_summary": reasoning_summary,
        }

        if llm_error:
            updates["errors"] = [llm_error]

        return updates

    # -------------------------------------------------------------------------
    # Node 6: Deterministic Business Rules Enforcement
    # -------------------------------------------------------------------------
    async def apply_business_rules_node(state: InvestigationState) -> Dict[str, Any]:
        """
        Enforces authoritative constraints from RULES.md (window > 30 days,
        high value > $500, non-refundable categories, active chargebacks).
        DETERMINISTIC CODE STRICTLY OVERRIDES THE LLM 100% OF THE TIME.
        """
        # Preserve early missing information outcome
        if state.get("decision") == BusinessDecision.NEEDS_MORE_INFORMATION:
            return {}

        op = state.get("operational_evidence", OperationalEvidence())
        rule_eval = evaluate_order_rules(
            order=op.order,
            reference_date=state.get("reference_date"),
            refund=op.refund,
        )

        # Deterministic override: rules take precedence over LLM
        final_decision = (
            rule_eval.forced_decision
            or state.get("llm_decision")
            or BusinessDecision.UNABLE_TO_DETERMINE
        )

        summary = state.get("summary", "")
        reasoning_summary = state.get("reasoning_summary", "")

        # Fallback text if LLM was unavailable or rule forced override
        if not summary or rule_eval.forced_decision:
            if final_decision == BusinessDecision.ELIGIBLE:
                summary = "Your order is eligible for refund under policy guidelines [POL-REFUND-001]."
            elif final_decision == BusinessDecision.INELIGIBLE:
                summary = "Your request does not qualify for refund under current policy constraints."
            elif final_decision == BusinessDecision.NEEDS_HUMAN_REVIEW:
                summary = "Your request requires review and approval by a support supervisor."
            else:
                summary = "We are unable to automatically resolve your request at this time."

        if not reasoning_summary or rule_eval.review_reasons:
            if rule_eval.review_reasons:
                reasoning_summary = " ".join(rule_eval.review_reasons)
            elif not reasoning_summary:
                reasoning_summary = "Evaluated against company operational guidelines."

        requires_human = (
            rule_eval.requires_human_review
            or final_decision == BusinessDecision.NEEDS_HUMAN_REVIEW
            or state.get("requires_human_review", False)
            or bool(state.get("conflicts"))
        )

        review_reasons = list(rule_eval.review_reasons)

        # Guard against false eligibility: If order records are missing due to error,
        # never permit an ELIGIBLE decision.
        if op.order is None and state.get("order_id"):
            missing = state.get("missing_information", [])
            if any("service error" in m.lower() or "degraded" in m.lower() for m in missing):
                final_decision = BusinessDecision.UNABLE_TO_DETERMINE
                requires_human = True
                review_reasons.append("Operational records unavailable due to Tool Service degradation.")
                summary = "We encountered a temporary technical issue retrieving your order details. A support specialist will review your request."
            elif any("not found" in m.lower() for m in missing):
                final_decision = BusinessDecision.NEEDS_MORE_INFORMATION
                summary = f"Order '{state.get('order_id')}' could not be located in our records. Please verify the order number."

        # If evidence conflict occurred, override summary and decision
        if state.get("conflicts"):
            summary = "Your inquiry requires verification by a support agent due to a discrepancy between your message and our tracking records."
            final_decision = BusinessDecision.NEEDS_HUMAN_REVIEW
            requires_human = True

        updates: Dict[str, Any] = {
            "rule_forced_decision": rule_eval.forced_decision,
            "decision": final_decision,
            "summary": summary,
            "reasoning_summary": reasoning_summary,
            "requires_human_review": requires_human,
        }

        if review_reasons:
            updates["review_reasons"] = review_reasons

        return updates

    # -------------------------------------------------------------------------
    # Node 7: Finalize Response
    # -------------------------------------------------------------------------
    async def finalize_response_node(state: InvestigationState) -> Dict[str, Any]:
        """
        Assembles the authoritative InvestigationResponse and computes latency.
        Strictly guarantees read-only invariants (actions_taken = []).
        """
        dt = round((time.time() - state.get("start_time", time.time())) * 1000, 2)

        # Technical pipeline status
        status = InvestigationStatus.COMPLETED
        if state.get("errors"):
            status = InvestigationStatus.PARTIAL_EVIDENCE

        response = InvestigationResponse(
            ticket_id=state.get("ticket_id"),
            status=status,
            decision=state.get("decision", BusinessDecision.UNABLE_TO_DETERMINE),
            summary=state.get("summary", ""),
            reasoning_summary=state.get("reasoning_summary", ""),
            policy_evidence=state.get("policy_evidence", []),
            operational_evidence=state.get("operational_evidence", OperationalEvidence()),
            missing_information=state.get("missing_information", []),
            requires_human_review=state.get("requires_human_review", False),
            review_reasons=state.get("review_reasons", []),
            actions_taken=[],  # Read-only guarantee
            errors=state.get("errors", []),
            duration_ms=dt,
        )

        return {
            "status": status,
            "duration_ms": dt,
            "final_response": response,
        }

    # -------------------------------------------------------------------------
    # Node 8: Human Supervisor Review (Durable Pause & Resume)
    # -------------------------------------------------------------------------
    async def human_review_node(state: InvestigationState) -> Dict[str, Any]:
        """
        Durable human review resumption node.
        Executes when the supervisor resumes a paused thread.
        Validates the supervisor's review payload and applies their decision.
        Strictly prevents arbitrary or forged actions from approving requests.
        """
        sup = state.get("supervisor_review")
        if not sup or not isinstance(sup, dict):
            return {}

        raw_action = str(sup.get("action", "")).upper().strip()
        reviewer_id = str(sup.get("reviewer_id", "SUPERVISOR")).strip()
        notes = str(sup.get("notes", "No supervisor notes provided.")).strip()

        if raw_action not in ["APPROVE", "REJECT"]:
            raise ValueError(
                f"Unauthorized review action '{raw_action}'. Authorized actions are strictly 'APPROVE' or 'REJECT'."
            )

        if raw_action == "APPROVE":
            new_decision = BusinessDecision.ELIGIBLE
            summary = f"Your inquiry has been approved by operations supervisor ({reviewer_id})."
            reasoning = f"Manual supervisor approval granted by {reviewer_id}. Notes: {notes}"
        else:
            new_decision = BusinessDecision.INELIGIBLE
            summary = f"Your inquiry was reviewed and declined by operations supervisor ({reviewer_id})."
            reasoning = f"Manual supervisor rejection issued by {reviewer_id}. Notes: {notes}"

        return {
            "decision": new_decision,
            "summary": summary,
            "reasoning_summary": reasoning,
            "requires_human_review": False,
            "supervisor_review": {
                "action": raw_action,
                "reviewer_id": reviewer_id,
                "notes": notes,
                "timestamp": datetime.utcnow().isoformat(),
            },
        }

    # -------------------------------------------------------------------------
    # Conditional Routing Logic
    # -------------------------------------------------------------------------
    def route_after_safety(state: InvestigationState) -> str:
        """
        Inspects is_safe flag. Routes directly to escalate_threat if adversarial.
        """
        if not state.get("is_safe", True):
            return "escalate_threat"
        return "extract_entities"

    def route_after_rules(state: InvestigationState) -> str:
        """
        Inspects human review requirement. If review is required AND a durable
        checkpointer is configured, routes to human_review node.
        Otherwise proceeds directly to finalize_response.
        """
        if checkpointer is not None and state.get("requires_human_review", False):
            return "human_review"
        return "finalize_response"

    # -------------------------------------------------------------------------
    # Graph Topology Construction
    # -------------------------------------------------------------------------
    builder = StateGraph(InvestigationState)

    # Register Nodes
    builder.add_node("safety_check", safety_check_node)
    builder.add_node("escalate_threat", escalate_threat_node)
    builder.add_node("extract_entities", extract_entities_node)
    builder.add_node("collect_evidence", collect_evidence_node)
    builder.add_node("reason_over_evidence", reason_over_evidence_node)
    builder.add_node("apply_business_rules", apply_business_rules_node)
    builder.add_node("human_review", human_review_node)
    builder.add_node("finalize_response", finalize_response_node)

    # Register Edges & Conditional Routing
    builder.add_edge(START, "safety_check")

    builder.add_conditional_edges(
        "safety_check",
        route_after_safety,
        {
            "escalate_threat": "escalate_threat",
            "extract_entities": "extract_entities",
        },
    )

    builder.add_edge("escalate_threat", END)
    builder.add_edge("extract_entities", "collect_evidence")
    builder.add_edge("collect_evidence", "reason_over_evidence")
    builder.add_edge("reason_over_evidence", "apply_business_rules")

    builder.add_conditional_edges(
        "apply_business_rules",
        route_after_rules,
        {
            "human_review": "human_review",
            "finalize_response": "finalize_response",
        },
    )

    builder.add_edge("human_review", "finalize_response")
    builder.add_edge("finalize_response", END)

    # Compile Graph with checkpoint persistence and durable interrupt
    interrupt_before = ["human_review"] if checkpointer is not None else None
    return builder.compile(checkpointer=checkpointer, interrupt_before=interrupt_before)
