"""
Master Ticket Investigation Workflow for AutoResolve AI.

Integrates the compiled LangGraph orchestration engine into the Resolution Service,
connecting safety checks, entity extraction, evidence collection (RAG + Tools),
conflict detection, grounded Qwen3 reasoning, and deterministic business rules.
"""

import logging
import time
from typing import Any, Dict, Optional
from app.clients.rag_client import RAGClient
from app.clients.tool_client import ToolClient
from app.database import save_ticket, save_audit_log
from app.models.resolution import (
    BusinessDecision,
    InvestigationRequest,
    InvestigationResponse,
    InvestigationStatus,
)
from app.workflows.graph import create_resolution_graph
from app.workflows.reasoning import QwenReasoner
from app.workflows.state import create_initial_state

logger = logging.getLogger("autoresolve.resolution.workflow")


class InvestigationWorkflow:
    """
    End-to-end investigation orchestrator powered by LangGraph.
    """

    def __init__(
        self,
        rag_client: RAGClient,
        tool_client: ToolClient,
        reasoner: Optional[QwenReasoner] = None,
        checkpointer: Any = None,
    ):
        self.rag_client = rag_client
        self.tool_client = tool_client
        self.reasoner = reasoner or QwenReasoner()
        self.checkpointer = checkpointer
        self.graph = create_resolution_graph(
            rag_client=self.rag_client,
            tool_client=self.tool_client,
            reasoner=self.reasoner,
            checkpointer=self.checkpointer,
        )

    async def investigate(
        self,
        request: InvestigationRequest,
        reference_date: Optional[Any] = None,
        config: Optional[Dict[str, Any]] = None,
    ) -> InvestigationResponse:
        """
        Executes end-to-end investigation orchestrated via the compiled LangGraph.
        Catches any unexpected technical faults to ensure a global fail-safe boundary.
        """
        t0 = time.time()
        try:
            init_state = create_initial_state(request, reference_date=reference_date)

            # Auto-configure thread_id for LangGraph SQLite checkpointing
            if config is None and self.checkpointer is not None:
                thread_key = request.ticket_id or f"thread-{int(time.time()*1000)}"
                config = {"configurable": {"thread_id": thread_key}}

            final_state = await self.graph.ainvoke(init_state, config=config)
            response = final_state.get("final_response")
            if not response:
                raise RuntimeError("Graph execution finished without generating final_response.")

            # Phase 2: Automated Action Execution (Mutations)
            # If eligible and approved without human review, execute authoritative refund & return label!
            if (
                response.decision == BusinessDecision.ELIGIBLE
                and not response.requires_human_review
            ):
                op_order = response.operational_evidence.order or {}
                op_customer = response.operational_evidence.customer or {}
                target_order_id = request.order_id or op_order.get("order_id")
                target_customer_id = request.customer_id or op_customer.get("customer_id")
                order_amount = float(
                    op_order.get("total_amount", 0.0)
                    or op_order.get("amount", 0.0)
                    or 120.0
                )

                executed_actions = list(response.actions_taken)
                if target_order_id and target_customer_id:
                    try:
                        # 1. Authoritative Refund Execution
                        refund_res = await self.tool_client.execute_refund(
                            order_id=target_order_id,
                            customer_id=target_customer_id,
                            amount=order_amount,
                            reason=f"Automated resolution for ticket {response.ticket_id}: {response.summary}",
                        )
                        executed_actions.append(
                            f"REFUND_EXECUTED: {refund_res.get('refund_id')} (${order_amount:.2f} via {refund_res.get('gateway_transaction_id')})"
                        )

                        # 2. Prepaid Return Shipping Voucher Allocation
                        label_res = await self.tool_client.generate_shipping_label(
                            order_id=target_order_id,
                            customer_id=target_customer_id,
                            carrier="UPS Ground",
                        )
                        executed_actions.append(
                            f"RETURN_LABEL_ISSUED: Carrier {label_res.get('carrier')} (Tracking #{label_res.get('tracking_number')})"
                        )

                        response.actions_taken = executed_actions
                        response.summary = (
                            f"{response.summary} Full refund of ${order_amount:.2f} executed "
                            f"(Gateway Ref: {refund_res.get('gateway_transaction_id')}). "
                            f"Return tracking number: {label_res.get('tracking_number')}."
                        )
                    except Exception as action_err:
                        logger.error("Phase 2 Action execution failed: %s", action_err)
                        executed_actions.append(f"ACTION_EXECUTION_FAILED: {str(action_err)}")
                        response.actions_taken = executed_actions

            # Persist ticket and audit log to SQLite
            try:
                op_order = response.operational_evidence.order or {}
                op_customer = response.operational_evidence.customer or {}
                save_ticket({
                    "ticket_id": response.ticket_id,
                    "order_id": request.order_id or op_order.get("order_id"),
                    "customer_id": request.customer_id or op_customer.get("customer_id"),
                    "customer_message": request.ticket_text,
                    "decision": response.decision.value if hasattr(response.decision, "value") else str(response.decision),
                    "status": "PENDING_REVIEW" if response.requires_human_review else (response.status.value if hasattr(response.status, "value") else str(response.status)),
                    "summary": response.summary,
                    "reasoning_summary": response.reasoning_summary,
                    "requires_human_review": 1 if response.requires_human_review else 0,
                    "review_reasons": response.review_reasons,
                    "duration_ms": response.duration_ms,
                })
                save_audit_log(
                    ticket_id=response.ticket_id,
                    node_name="finalize_response",
                    action="INVESTIGATION_COMPLETED" if not response.actions_taken else "ACTIONS_EXECUTED",
                    policy_citations=[p.document_id for p in response.policy_evidence],
                    operational_snapshot={
                        "order_id": op_order.get("order_id"),
                        "customer_id": op_customer.get("customer_id"),
                        "amount": op_order.get("total_amount"),
                        "actions_taken": response.actions_taken,
                    },
                    details=f"Decision: {response.decision.value}. Actions: {'; '.join(response.actions_taken) if response.actions_taken else 'None'}.",
                )

                # Dispatch asynchronous HITL supervisor alert if human review is required
                if response.requires_human_review:
                    try:
                        from app.alerts.dispatcher import dispatch_hitl_alert
                        await dispatch_hitl_alert(
                            ticket_id=response.ticket_id,
                            order_id=request.order_id or op_order.get("order_id"),
                            customer_id=request.customer_id or op_customer.get("customer_id"),
                            reason="; ".join(response.review_reasons) if response.review_reasons else response.reasoning_summary,
                            amount=float(op_order.get("total_amount", 0.0) or 0.0) if op_order else None,
                        )
                    except Exception as alert_err:
                        logger.warning("Failed to dispatch asynchronous HITL alert: %s", alert_err)
            except Exception as db_err:
                logger.warning("Failed to persist ticket to SQLite: %s", db_err)

            return response
        except Exception as err:
            dt = round((time.time() - t0) * 1000, 2)
            fail_res = InvestigationResponse(
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
            try:
                save_ticket({
                    "ticket_id": request.ticket_id,
                    "order_id": request.order_id,
                    "customer_id": request.customer_id,
                    "customer_message": request.ticket_text,
                    "decision": "UNABLE_TO_DETERMINE",
                    "status": "FAILED",
                    "summary": fail_res.summary,
                    "reasoning_summary": fail_res.reasoning_summary,
                    "requires_human_review": 1,
                    "review_reasons": fail_res.review_reasons,
                    "duration_ms": dt,
                })
            except Exception as db_err:
                logger.warning("Failed to record failed ticket to SQLite: %s", db_err)

            return fail_res

    async def close(self):
        """Closes all underlying HTTP client resources."""
        await self.rag_client.close()
        await self.tool_client.close()
        await self.reasoner.close()
