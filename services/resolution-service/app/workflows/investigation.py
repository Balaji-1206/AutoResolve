"""
Master Ticket Investigation Workflow for AutoResolve AI.

Integrates identifier extraction, evidence collection (RAG + Tools),
adversarial defense, conflict detection, deterministic business rules,
and grounded Qwen3 reasoning into a single robust pipeline.
"""

import time
from typing import Any, Optional
from app.clients.rag_client import RAGClient
from app.clients.tool_client import ToolClient
from app.models.resolution import (
    BusinessDecision,
    InvestigationRequest,
    InvestigationResponse,
    InvestigationStatus,
)
from app.workflows.evidence import EvidenceCollector
from app.workflows.reasoning import QwenReasoner
from app.workflows.safety import check_evidence_conflicts, detect_adversarial_patterns


class InvestigationWorkflow:
    """
    End-to-end investigation orchestrator.
    """

    def __init__(
        self,
        rag_client: RAGClient,
        tool_client: ToolClient,
        reasoner: Optional[QwenReasoner] = None,
    ):
        self.rag_client = rag_client
        self.tool_client = tool_client
        self.evidence_collector = EvidenceCollector(rag_client, tool_client)
        self.reasoner = reasoner or QwenReasoner()

    async def investigate(
        self,
        request: InvestigationRequest,
        reference_date: Optional[Any] = None,
    ) -> InvestigationResponse:
        """
        Executes end-to-end investigation with safety and failure handling.
        """
        t0 = time.time()

        # Step 1: Scan for adversarial attacks / prompt injection
        adversarial_threats = detect_adversarial_patterns(request.ticket_text)
        if adversarial_threats:
            dt = round((time.time() - t0) * 1000, 2)
            return InvestigationResponse(
                ticket_id=request.ticket_id,
                status=InvestigationStatus.COMPLETED,
                decision=BusinessDecision.NEEDS_HUMAN_REVIEW,
                summary="Your inquiry has been routed to a senior operations supervisor for manual review.",
                reasoning_summary="Security alert: Unauthorized system override or administrative privilege claim detected in ticket text.",
                requires_human_review=True,
                review_reasons=adversarial_threats,
                actions_taken=[],
                duration_ms=dt,
            )

        try:
            # Step 2: Gather Evidence across RAG and Tools
            evidence = await self.evidence_collector.collect_evidence(request)

            # Step 3: Check for logical contradictions between claims and operational facts
            conflicts = check_evidence_conflicts(
                request.ticket_text, evidence.operational_evidence.order
            )

            # Step 4: Perform Grounded Reasoning and Apply Deterministic Rules
            response = await self.reasoner.reason(
                evidence=evidence,
                customer_text=request.ticket_text,
                reference_date=reference_date,
            )

            # Step 5: Incorporate conflict findings
            if conflicts:
                response.requires_human_review = True
                response.review_reasons.extend(conflicts)
                response.decision = BusinessDecision.NEEDS_HUMAN_REVIEW
                response.summary = (
                    "Your inquiry requires verification by a support agent due to a discrepancy between your message and our tracking records."
                )

            # Step 6: Final Invariant Enforcements
            response.actions_taken = []  # Read-only invariant guarantee
            response.duration_ms = round((time.time() - t0) * 1000, 2)
            return response

        except Exception as err:
            # Global Fail-Safe Boundary: Never crash or expose internal stack traces
            dt = round((time.time() - t0) * 1000, 2)
            return InvestigationResponse(
                ticket_id=request.ticket_id,
                status=InvestigationStatus.FAILED,
                decision=BusinessDecision.UNABLE_TO_DETERMINE,
                summary="We encountered an unexpected technical issue while assessing your inquiry. A support representative will assist you.",
                reasoning_summary="Internal investigation failure occurred during workflow execution.",
                requires_human_review=True,
                review_reasons=["Workflow execution failure requiring manual fallback."],
                actions_taken=[],
                errors=[f"Safe failure: {str(err)}"],
                duration_ms=dt,
            )

    async def close(self):
        """Closes all underlying HTTP client resources."""
        await self.rag_client.close()
        await self.tool_client.close()
        await self.reasoner.close()
