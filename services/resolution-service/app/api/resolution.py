"""
FastAPI Router for Resolution & Investigation Operations.

Endpoint:
- POST /api/v1/resolution/investigate: Executes grounded ticket investigation.
"""

import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from app.database import get_ticket, get_ticket_audit_logs, list_tickets
from app.models.resolution import InvestigationRequest, InvestigationResponse
from app.workflows.investigation import InvestigationWorkflow

logger = logging.getLogger("autoresolve.resolution")

router = APIRouter(prefix="/resolution", tags=["Ticket Investigation Engine"])


def get_workflow(request: Request) -> InvestigationWorkflow:
    """
    Dependency injector retrieving the pre-initialized InvestigationWorkflow singleton
    stored on app.state during application startup.
    """
    workflow = getattr(request.app.state, "workflow", None)
    if workflow is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Resolution workflow engine is not initialized.",
        )
    return workflow


@router.post(
    "/investigate",
    response_model=InvestigationResponse,
    summary="Investigate Customer Ticket",
    description=(
        "Performs grounded policy evaluation and operational database lookups for a support ticket. "
        "Returns eligibility assessment, citations, and evidence while strictly preserving read-only guarantees."
    ),
)
async def investigate_ticket(
    request_data: InvestigationRequest,
    workflow: InvestigationWorkflow = Depends(get_workflow),
) -> InvestigationResponse:
    """
    Executes the multi-source ticket investigation workflow.
    """
    response = await workflow.investigate(request_data)

    # Privacy-conscious structured logging: log metrics and decisions without logging PII
    logger.info(
        "Ticket investigated | id=%s status=%s decision=%s human_review=%s latency=%.2fms",
        response.ticket_id or "ANONYMOUS",
        response.status.value,
        response.decision.value,
        response.requires_human_review,
        response.duration_ms,
    )

    return response


@router.get(
    "/tickets",
    summary="List Persisted Tickets",
    description="Retrieves persistent ticket records from SQLite, ordered chronologically by latest activity.",
)
async def get_tickets(
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> List[Dict[str, Any]]:
    """Fetches list of saved ticket records."""
    return list_tickets(limit=limit, offset=offset)


@router.get(
    "/tickets/{ticket_id}",
    summary="Get Ticket Details & Audit Trail",
    description="Fetches a persisted ticket by ID along with its full multi-step investigation audit logs.",
)
async def get_ticket_by_id(ticket_id: str) -> Dict[str, Any]:
    """Fetches single ticket with audit trail."""
    ticket = get_ticket(ticket_id)
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket '{ticket_id}' not found.",
        )
    audit_logs = get_ticket_audit_logs(ticket_id)
    return {
        "ticket": ticket,
        "audit_logs": audit_logs,
    }
