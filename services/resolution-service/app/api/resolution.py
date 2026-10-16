"""
FastAPI Router for Resolution & Investigation Operations.

Endpoint:
- POST /api/v1/resolution/investigate: Executes grounded ticket investigation.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, Request, status
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
