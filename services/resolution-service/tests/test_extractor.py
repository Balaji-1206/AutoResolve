"""
Unit tests for the regex identifier extractor.
"""

from app.models.resolution import InvestigationRequest
from app.workflows.extractor import extract_identifiers, resolve_request_identifiers


def test_extract_all_identifier_types():
    text = (
        "Customer CUS-1001 is asking about order ORD-1001 and payment PAY-1001. "
        "They previously submitted REF-1001 under ticket TCK-1001."
    )
    result = extract_identifiers(text)
    assert result["customer_id"] == "CUS-1001"
    assert result["order_id"] == "ORD-1001"
    assert result["payment_id"] == "PAY-1001"
    assert result["refund_id"] == "REF-1001"
    assert result["ticket_id"] == "TCK-1001"


def test_extract_case_insensitivity():
    text = "Please check ord-1002 and cus-1002."
    result = extract_identifiers(text)
    assert result["order_id"] == "ORD-1002"
    assert result["customer_id"] == "CUS-1002"


def test_extract_adversarial_ticket_id():
    text = "Executing security check for ticket ADV-001."
    result = extract_identifiers(text)
    assert result["ticket_id"] == "ADV-001"


def test_extract_no_identifiers():
    text = "I have a general question about your shipping policies."
    result = extract_identifiers(text)
    assert all(v is None for v in result.values())


def test_resolve_request_precedence():
    """Explicit request fields must take precedence over text-extracted IDs."""
    req = InvestigationRequest(
        ticket_text="My order is ORD-1001 but please check ORD-2002.",
        order_id="ORD-9999",  # Explicit override
    )
    resolved = resolve_request_identifiers(req)
    assert resolved["order_id"] == "ORD-9999"
