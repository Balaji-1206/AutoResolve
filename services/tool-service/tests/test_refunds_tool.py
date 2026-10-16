"""
Unit Tests for get_refund() Tool in Tool Service.
"""

import pytest
from app.tools.refunds import get_refund, RefundNotFoundError


def test_get_existing_refund():
    """Verify an existing refund is retrieved with correct fields."""
    refund = get_refund("REF-1001")
    assert refund is not None
    assert refund.refund_id == "REF-1001"
    assert refund.order_id == "ORD-1004"
    assert refund.customer_id == "CUS-1004"
    assert refund.amount == 60.0
    assert refund.status == "COMPLETED"
    assert refund.reason == "CUSTOMER_RETURN"
    assert refund.requested_at == "2026-09-15T10:00:00Z"
    assert refund.approved_at == "2026-09-15T10:05:00Z"
    assert refund.processed_at == "2026-09-16T14:30:00Z"


def test_get_refund_case_and_whitespace_insensitivity():
    """Verify refund ID lookup handles casing and whitespace gracefully."""
    refund = get_refund("  ref-1001  ")
    assert refund.refund_id == "REF-1001"
    assert refund.amount == 60.0


def test_get_nonexistent_refund():
    """Verify querying a non-existent refund raises RefundNotFoundError."""
    with pytest.raises(RefundNotFoundError) as exc_info:
        get_refund("REF-9999")
    assert "REF-9999" in str(exc_info.value)


def test_get_refund_invalid_format():
    """Verify invalid refund ID formats raise ValueError."""
    with pytest.raises(ValueError) as exc_info:
        get_refund("WRONG-REFUND-FORMAT")
    assert "Invalid refund ID format" in str(exc_info.value)
