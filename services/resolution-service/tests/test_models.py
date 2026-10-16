"""
Unit tests for Resolution Service Pydantic request and response schemas.
"""

import pytest
from pydantic import ValidationError
from app.models.resolution import (
    BusinessDecision,
    InvestigationRequest,
    InvestigationResponse,
    InvestigationStatus,
    OperationalEvidence,
    PolicyEvidenceItem,
)


def test_valid_request_minimal():
    """Verifies that a ticket with only ticket_text is valid."""
    req = InvestigationRequest(ticket_text="My order ORD-1001 was delivered damaged.")
    assert req.ticket_text == "My order ORD-1001 was delivered damaged."
    assert req.ticket_id is None
    assert req.order_id is None
    assert req.customer_id is None


def test_valid_request_with_identifiers():
    """Verifies identifier normalization and validation."""
    req = InvestigationRequest(
        ticket_text="Checking status of my refund.",
        ticket_id="tck-1001",
        customer_id="cus-1001",
        order_id="ord-1001",
        payment_id="pay-1001",
        refund_id="ref-1001",
    )
    # Check that identifiers are converted to uppercase
    assert req.ticket_id == "TCK-1001"
    assert req.customer_id == "CUS-1001"
    assert req.order_id == "ORD-1001"
    assert req.payment_id == "PAY-1001"
    assert req.refund_id == "REF-1001"


@pytest.mark.parametrize(
    "field,invalid_value",
    [
        ("order_id", "INVALID_ORDER"),
        ("order_id", "ORD-XYZ"),
        ("customer_id", "CUST-1001"),
        ("payment_id", "1001"),
        ("refund_id", "REFUND-1001"),
        ("ticket_id", "TICKET-1"),
    ],
)
def test_invalid_identifier_formats(field, invalid_value):
    """Verifies that invalid identifier formats trigger ValidationError."""
    payload = {"ticket_text": "Sample inquiry text.", field: invalid_value}
    with pytest.raises(ValidationError):
        InvestigationRequest(**payload)


def test_short_ticket_text_rejected():
    """Verifies that ticket text shorter than 5 characters is rejected."""
    with pytest.raises(ValidationError):
        InvestigationRequest(ticket_text="Hi")


def test_valid_investigation_response():
    """Verifies complete instantiation and default field behaviors of InvestigationResponse."""
    resp = InvestigationResponse(
        ticket_id="TCK-1001",
        status=InvestigationStatus.COMPLETED,
        decision=BusinessDecision.ELIGIBLE,
        summary="Customer is eligible for refund under POL-REFUND-001.",
        reasoning_summary="Order delivered 14 days ago, within 30-day window, value $120 <= $500.",
        policy_evidence=[
            PolicyEvidenceItem(
                document_id="POL-REFUND-001",
                domain="refunds",
                authority="authoritative",
                section="Standard Refund Window",
                source="knowledge/policies/refund_policy.md",
                score=0.88,
                snippet="Customers may request a refund within 30 calendar days...",
            )
        ],
        operational_evidence=OperationalEvidence(
            order={"order_id": "ORD-1001", "status": "DELIVERED", "total_amount": 120.0},
            tools_called=["get_order"],
        ),
        missing_information=[],
        requires_human_review=False,
    )

    assert resp.status == InvestigationStatus.COMPLETED
    assert resp.decision == BusinessDecision.ELIGIBLE
    # Ensure actions_taken defaults strictly to empty list
    assert resp.actions_taken == []
    assert resp.requires_human_review is False
    assert len(resp.policy_evidence) == 1
    assert resp.operational_evidence.tools_called == ["get_order"]


def test_decision_and_status_enum_values():
    """Ensures exact string values match the documented contract."""
    assert InvestigationStatus.COMPLETED.value == "COMPLETED"
    assert InvestigationStatus.PARTIAL_EVIDENCE.value == "PARTIAL_EVIDENCE"
    assert InvestigationStatus.FAILED.value == "FAILED"

    assert BusinessDecision.ELIGIBLE.value == "ELIGIBLE"
    assert BusinessDecision.INELIGIBLE.value == "INELIGIBLE"
    assert BusinessDecision.NEEDS_MORE_INFORMATION.value == "NEEDS_MORE_INFORMATION"
    assert BusinessDecision.NEEDS_HUMAN_REVIEW.value == "NEEDS_HUMAN_REVIEW"
    assert BusinessDecision.UNABLE_TO_DETERMINE.value == "UNABLE_TO_DETERMINE"
