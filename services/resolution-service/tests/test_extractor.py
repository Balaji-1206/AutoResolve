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


def test_extract_multiple_identifiers_same_type():
    """Verifies that extract_all_identifiers captures all occurrences without duplicates."""
    from app.workflows.extractor import extract_all_identifiers
    text = "Comparing order ORD-1001 with order ORD-1002 and ORD-1001 again."
    result = extract_all_identifiers(text)
    assert result["order_id"] == ["ORD-1001", "ORD-1002"]


def test_extract_malformed_identifiers_ignored():
    """Verifies that malformed or non-standard identifiers are rejected by regex boundaries."""
    text = "Checking ORD-ABC, CUS-, PAY-XYZ-123, and ORDER-1001."
    result = extract_identifiers(text)
    assert result["order_id"] is None
    assert result["customer_id"] is None
    assert result["payment_id"] is None


def test_is_valid_identifier():
    """Verifies the is_valid_identifier strict validator function."""
    from app.workflows.extractor import is_valid_identifier
    assert is_valid_identifier("order_id", "ORD-1001") is True
    assert is_valid_identifier("order_id", "ord-1001") is True
    assert is_valid_identifier("order_id", "ORD-ABC") is False
    assert is_valid_identifier("order_id", "") is False
    assert is_valid_identifier("customer_id", "CUS-1050") is True
    assert is_valid_identifier("customer_id", "CUS-") is False
    assert is_valid_identifier("payment_id", "PAY-2001") is True
    assert is_valid_identifier("refund_id", "REF-3001") is True
    assert is_valid_identifier("ticket_id", "TCK-4001") is True
    assert is_valid_identifier("ticket_id", "ADV-001") is True
    assert is_valid_identifier("ticket_id", "INC-001") is False


def test_resolve_request_preserves_all_explicit_ids():
    """Verifies that all explicit request fields are preserved over text matches."""
    req = InvestigationRequest(
        ticket_text="Please help with ORD-1001 and CUS-1001.",
        order_id="ORD-2002",
        customer_id="CUS-2002",
        payment_id="PAY-2002",
        refund_id="REF-2002",
        ticket_id="TCK-9999",
    )
    resolved = resolve_request_identifiers(req)
    assert resolved["order_id"] == "ORD-2002"
    assert resolved["customer_id"] == "CUS-2002"
    assert resolved["payment_id"] == "PAY-2002"
    assert resolved["refund_id"] == "REF-2002"
    assert resolved["ticket_id"] == "TCK-9999"

