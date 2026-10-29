"""
State definition for AutoResolve LangGraph Orchestration.

Maintains the complete, typed context of an investigation as it transitions
through safety verification, entity extraction, evidence collection,
reasoning, business rules evaluation, and response finalization.
"""

from datetime import datetime
import operator
import time
from typing import Annotated, Any, Dict, List, Optional
from typing_extensions import TypedDict
from app.models.resolution import (
    BusinessDecision,
    InvestigationRequest,
    InvestigationResponse,
    InvestigationStatus,
    OperationalEvidence,
    PolicyEvidenceItem,
)


class InvestigationState(TypedDict, total=False):
    """
    Internal shared state flowing through the AutoResolve LangGraph nodes.

    Designed with strict node ownership:
    - Input & Request parameters (initialized at start)
    - Safety findings (owned by safety_check)
    - Extracted entities (owned by extract_entities)
    - Evidence items (owned by collect_evidence)
    - Decisions and summaries (owned by reasoning and rules)
    - Accumulator lists (errors, missing_information, review_reasons) using operator.add
    - Final API response (owned by finalize_response)
    """

    # 1. Inbound Request & Identifiers
    ticket_text: str
    ticket_id: Optional[str]
    customer_id: Optional[str]
    order_id: Optional[str]
    payment_id: Optional[str]
    refund_id: Optional[str]
    reference_date: Optional[datetime]

    # 2. Safety & Adversarial Assessment
    is_safe: bool
    safety_threats: List[str]
    conflicts: List[str]

    # 3. Entity Extraction Findings
    extracted_entities: Dict[str, Optional[str]]

    # 4. Evidence Gathered (RAG & Tool Services)
    policy_evidence: List[PolicyEvidenceItem]
    operational_evidence: OperationalEvidence

    # 5. Reasoning & Deterministic Decisions
    llm_decision: Optional[BusinessDecision]
    rule_forced_decision: Optional[BusinessDecision]
    decision: BusinessDecision
    summary: str
    reasoning_summary: str

    # 6. Accumulators (using operator.add reducer to prevent overwriting)
    requires_human_review: bool
    supervisor_review: Optional[Dict[str, Any]]
    review_reasons: Annotated[List[str], operator.add]
    missing_information: Annotated[List[str], operator.add]
    errors: Annotated[List[str], operator.add]

    # 7. Lifecycle & Timing
    status: InvestigationStatus
    start_time: float
    duration_ms: float
    final_response: Optional[InvestigationResponse]


def create_initial_state(
    request: InvestigationRequest,
    reference_date: Optional[datetime] = None,
) -> InvestigationState:
    """
    Constructs a pristine, fully-initialized InvestigationState from an inbound request.
    Initializes all accumulator lists to empty lists and records the initial start timestamp.
    """
    return {
        "ticket_text": request.ticket_text,
        "ticket_id": request.ticket_id,
        "customer_id": request.customer_id,
        "order_id": request.order_id,
        "payment_id": request.payment_id,
        "refund_id": request.refund_id,
        "reference_date": reference_date,
        "is_safe": True,
        "safety_threats": [],
        "conflicts": [],
        "extracted_entities": {},
        "policy_evidence": [],
        "operational_evidence": OperationalEvidence(),
        "llm_decision": None,
        "rule_forced_decision": None,
        "decision": BusinessDecision.UNABLE_TO_DETERMINE,
        "summary": "",
        "reasoning_summary": "",
        "requires_human_review": False,
        "supervisor_review": None,
        "review_reasons": [],
        "missing_information": [],
        "errors": [],
        "status": InvestigationStatus.COMPLETED,
        "start_time": time.time(),
        "duration_ms": 0.0,
        "final_response": None,
    }

