"""
Admin & Supervisor API Endpoints.

Provides internal management routes for operations supervisors to view pending reviews,
inspect asynchronous alerts, and execute authoritative one-click approval or rejection decisions.
"""

from datetime import datetime
import json
import logging
from typing import Any, Dict, List, Literal, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.clients.tool_client import ToolClient
from app.database import (
    get_pending_reviews,
    get_ticket,
    get_ticket_audit_logs,
    list_supervisor_alerts,
    save_audit_log,
    update_ticket_review_status,
)

logger = logging.getLogger("autoresolve.resolution.api.admin")

router = APIRouter(prefix="/api/v1/resolution/admin", tags=["admin"])

_tool_client: Optional[ToolClient] = None


def get_tool_client() -> ToolClient:
    """Dependency helper to get or initialize ToolClient."""
    global _tool_client
    if _tool_client is None:
        _tool_client = ToolClient()
    return _tool_client


class SupervisorDecisionRequest(BaseModel):
    action: Literal["APPROVE", "REJECT"] = Field(..., description="Supervisor decision: APPROVE or REJECT")
    reviewer_id: str = Field(default="SUPERVISOR", description="Identifier of the store manager / supervisor")
    notes: str = Field(default="", description="Supervisor audit notes or justification")


class SupervisorDecisionResponse(BaseModel):
    success: bool
    ticket_id: str
    action: str
    status: str
    summary: str
    actions_taken: List[str] = Field(default_factory=list)
    timestamp: str


@router.get("/reviews", response_model=List[Dict[str, Any]])
async def list_pending_supervisor_reviews(
    limit: int = Query(50, ge=1, le=100),
):
    """
    Returns pending cases requiring human supervisor sign-off from SQLite.
    """
    reviews = get_pending_reviews(limit=limit)
    # Parse review_reasons json if string
    for r in reviews:
        if isinstance(r.get("review_reasons"), str):
            try:
                r["review_reasons"] = json.loads(r["review_reasons"])
            except Exception:
                r["review_reasons"] = [r["review_reasons"]]
    return reviews


@router.get("/alerts", response_model=List[Dict[str, Any]])
async def list_dispatched_alerts(
    limit: int = Query(50, ge=1, le=100),
):
    """
    Returns recent asynchronous HITL alerts dispatched to external channels (Slack / Webhook).
    """
    return list_supervisor_alerts(limit=limit)


@router.get("/reviews/{ticket_id}", response_model=Dict[str, Any])
async def get_review_case_details(ticket_id: str):
    """
    Returns detailed case information and audit history for a single ticket.
    """
    ticket = get_ticket(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found.")

    audit_logs = get_ticket_audit_logs(ticket_id)
    ticket_dict = dict(ticket)
    if isinstance(ticket_dict.get("review_reasons"), str):
        try:
            ticket_dict["review_reasons"] = json.loads(ticket_dict["review_reasons"])
        except Exception:
            ticket_dict["review_reasons"] = [ticket_dict["review_reasons"]]
    ticket_dict["audit_trail"] = audit_logs
    return ticket_dict


@router.post("/reviews/{ticket_id}/decision", response_model=SupervisorDecisionResponse)
async def process_supervisor_decision(
    ticket_id: str,
    payload: SupervisorDecisionRequest,
):
    """
    Applies the supervisor's decision to an escalated ticket.
    If APPROVE: executes authoritative refund & return label generation (Phase 2), mutates order to REFUNDED.
    If REJECT: marks inquiry rejected and records supervisor notes in audit trail.
    """
    ticket = get_ticket(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found.")

    now_iso = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    actions_taken: List[str] = []

    if payload.action == "APPROVE":
        order_id = ticket.get("order_id") or "ORD-1001"
        customer_id = ticket.get("customer_id") or "CUS-1001"
        tool_client = get_tool_client()

        # Phase 2 Action Execution
        try:
            refund_res = await tool_client.execute_refund(
                order_id=order_id,
                customer_id=customer_id,
                amount=120.0,
                reason=f"Supervisor approval by {payload.reviewer_id}: {payload.notes}",
            )
            actions_taken.append(
                f"REFUND_EXECUTED: {refund_res.get('refund_id')} via {refund_res.get('gateway_transaction_id')}"
            )

            label_res = await tool_client.generate_shipping_label(
                order_id=order_id,
                customer_id=customer_id,
                carrier="UPS Ground",
            )
            actions_taken.append(
                f"RETURN_LABEL_ISSUED: Carrier {label_res.get('carrier')} (Tracking #{label_res.get('tracking_number')})"
            )

            summary = (
                f"Your inquiry has been approved by operations supervisor ({payload.reviewer_id}). "
                f"Full refund executed (Gateway Ref: {refund_res.get('gateway_transaction_id')}). "
                f"Return tracking number: {label_res.get('tracking_number')}."
            )
        except Exception as action_err:
            logger.error("Phase 2 action execution during supervisor approval failed: %s", action_err)
            actions_taken.append(f"ACTION_EXECUTION_FAILED: {str(action_err)}")
            summary = f"Approved by supervisor ({payload.reviewer_id}), but automated execution encountered: {str(action_err)}"

        update_ticket_review_status(
            ticket_id=ticket_id,
            status="APPROVED",
            decision="ELIGIBLE",
            summary=summary,
        )
        save_audit_log(
            ticket_id=ticket_id,
            node_name="supervisor_review",
            action="SUPERVISOR_APPROVAL",
            details=f"Supervisor {payload.reviewer_id} approved ticket. Notes: {payload.notes}. Actions: {'; '.join(actions_taken)}",
        )

        return SupervisorDecisionResponse(
            success=True,
            ticket_id=ticket_id,
            action="APPROVE",
            status="APPROVED",
            summary=summary,
            actions_taken=actions_taken,
            timestamp=now_iso,
        )

    else:
        # Supervisor REJECT
        summary = (
            f"Your inquiry was reviewed and declined by operations supervisor ({payload.reviewer_id}). "
            f"Notes: {payload.notes}"
        )
        update_ticket_review_status(
            ticket_id=ticket_id,
            status="REJECTED",
            decision="INELIGIBLE",
            summary=summary,
        )
        save_audit_log(
            ticket_id=ticket_id,
            node_name="supervisor_review",
            action="SUPERVISOR_REJECTION",
            details=f"Supervisor {payload.reviewer_id} rejected ticket. Notes: {payload.notes}",
        )

        return SupervisorDecisionResponse(
            success=True,
            ticket_id=ticket_id,
            action="REJECT",
            status="REJECTED",
            summary=summary,
            actions_taken=[],
            timestamp=now_iso,
        )
