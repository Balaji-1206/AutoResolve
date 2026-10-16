"""
AutoResolve AI - Resolution Service Request and Response Schemas.

Defines the contract for customer ticket investigations, ensuring strict separation
between technical pipeline status and business decision outcomes.
"""

from enum import Enum
import re
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class InvestigationStatus(str, Enum):
    """
    Technical lifecycle status of the investigation pipeline.
    Represents whether the technical workflow succeeded in gathering evidence.
    """
    COMPLETED = "COMPLETED"
    PARTIAL_EVIDENCE = "PARTIAL_EVIDENCE"
    FAILED = "FAILED"


class BusinessDecision(str, Enum):
    """
    Authoritative business eligibility evaluation.
    Represents whether the customer request satisfies established policy parameters.
    """
    ELIGIBLE = "ELIGIBLE"
    INELIGIBLE = "INELIGIBLE"
    NEEDS_MORE_INFORMATION = "NEEDS_MORE_INFORMATION"
    NEEDS_HUMAN_REVIEW = "NEEDS_HUMAN_REVIEW"
    UNABLE_TO_DETERMINE = "UNABLE_TO_DETERMINE"


class InvestigationRequest(BaseModel):
    """
    Inbound customer ticket investigation request payload.
    """
    model_config = ConfigDict(populate_by_name=True)

    ticket_text: str = Field(
        ...,
        min_length=5,
        max_length=5000,
        description="Customer support ticket message or description",
        examples=["My order ORD-1001 was delivered, but I want a refund. Am I eligible?"]
    )
    ticket_id: Optional[str] = Field(
        default=None,
        description="Optional unique ticket identifier",
        examples=["TCK-1001"]
    )
    customer_id: Optional[str] = Field(
        default=None,
        description="Optional pre-identified Customer ID (format: CUS-XXXX)",
        examples=["CUS-1001"]
    )
    order_id: Optional[str] = Field(
        default=None,
        description="Optional pre-identified Order ID (format: ORD-XXXX)",
        examples=["ORD-1001"]
    )
    payment_id: Optional[str] = Field(
        default=None,
        description="Optional pre-identified Payment ID (format: PAY-XXXX)",
        examples=["PAY-1001"]
    )
    refund_id: Optional[str] = Field(
        default=None,
        description="Optional pre-identified Refund ID (format: REF-XXXX)",
        examples=["REF-1001"]
    )

    @field_validator("customer_id")
    @classmethod
    def validate_customer_id(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        clean = v.strip().upper()
        if not re.match(r"^CUS-\d+$", clean):
            raise ValueError(f"Invalid customer_id format '{v}'. Expected format: 'CUS-XXXX'")
        return clean

    @field_validator("order_id")
    @classmethod
    def validate_order_id(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        clean = v.strip().upper()
        if not re.match(r"^ORD-\d+$", clean):
            raise ValueError(f"Invalid order_id format '{v}'. Expected format: 'ORD-XXXX'")
        return clean

    @field_validator("payment_id")
    @classmethod
    def validate_payment_id(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        clean = v.strip().upper()
        if not re.match(r"^PAY-\d+$", clean):
            raise ValueError(f"Invalid payment_id format '{v}'. Expected format: 'PAY-XXXX'")
        return clean

    @field_validator("refund_id")
    @classmethod
    def validate_refund_id(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        clean = v.strip().upper()
        if not re.match(r"^REF-\d+$", clean):
            raise ValueError(f"Invalid refund_id format '{v}'. Expected format: 'REF-XXXX'")
        return clean

    @field_validator("ticket_id")
    @classmethod
    def validate_ticket_id(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        clean = v.strip().upper()
        if not re.match(r"^(TCK|ADV)-\d+$", clean):
            raise ValueError(f"Invalid ticket_id format '{v}'. Expected format: 'TCK-XXXX' or 'ADV-XXXX'")
        return clean


class PolicyEvidenceItem(BaseModel):
    """
    Grounded policy citation retrieved from RAG knowledge store.
    """
    document_id: str = Field(..., description="Document ID (e.g. POL-REFUND-001)")
    domain: str = Field(..., description="Policy domain (e.g. refunds, shipping)")
    authority: str = Field(..., description="Authority level: authoritative, explanatory, or operational")
    section: str = Field(..., description="Section heading from the policy")
    source: str = Field(..., description="File path relative to repository")
    score: float = Field(..., description="Vector cosine similarity score")
    snippet: str = Field(..., description="Text excerpt from the policy chunk")


class OperationalEvidence(BaseModel):
    """
    Ground-truth operational facts retrieved via the Tool Service.
    """
    customer: Optional[Dict[str, Any]] = Field(default=None, description="Customer profile if retrieved")
    order: Optional[Dict[str, Any]] = Field(default=None, description="Order details if retrieved")
    payment: Optional[Dict[str, Any]] = Field(default=None, description="Payment transaction if retrieved")
    refund: Optional[Dict[str, Any]] = Field(default=None, description="Refund claim if retrieved")
    tools_called: List[str] = Field(default_factory=list, description="List of tool endpoints successfully invoked")


class InvestigationResponse(BaseModel):
    """
    Comprehensive structured response for a ticket investigation.
    """
    model_config = ConfigDict(populate_by_name=True)

    ticket_id: Optional[str] = Field(default=None, description="Associated ticket ID")
    status: InvestigationStatus = Field(..., description="Technical pipeline execution status")
    decision: BusinessDecision = Field(..., description="Authoritative business eligibility evaluation")
    summary: str = Field(..., description="High-level plain English explanation of outcome")
    reasoning_summary: str = Field(..., description="Step-by-step grounded explanation linking evidence to policy")
    policy_evidence: List[PolicyEvidenceItem] = Field(
        default_factory=list,
        description="Retrieved policy citations supporting the assessment"
    )
    operational_evidence: OperationalEvidence = Field(
        default_factory=OperationalEvidence,
        description="Ground-truth data points retrieved from operational databases"
    )
    missing_information: List[str] = Field(
        default_factory=list,
        description="Unresolved identifiers or data points preventing automatic resolution"
    )
    requires_human_review: bool = Field(
        default=False,
        description="Flag indicating whether human supervisor approval or intervention is mandatory"
    )
    review_reasons: List[str] = Field(
        default_factory=list,
        description="Specific business rules triggering mandatory human review"
    )
    actions_taken: List[str] = Field(
        default_factory=list,
        description="List of state-changing actions executed (strictly empty for read-only investigation)"
    )
    errors: List[str] = Field(
        default_factory=list,
        description="Non-fatal warnings or service degradation notes"
    )
    duration_ms: float = Field(
        default=0.0,
        description="End-to-end investigation latency in milliseconds"
    )
