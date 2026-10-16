"""
Unit Tests for get_payment() Tool in Tool Service.
"""

import pytest
from app.tools.payments import get_payment, PaymentNotFoundError


def test_get_existing_payment():
    """Verify an existing payment is retrieved with correct fields."""
    payment = get_payment("PAY-1001")
    assert payment is not None
    assert payment.payment_id == "PAY-1001"
    assert payment.order_id == "ORD-1001"
    assert payment.customer_id == "CUS-1001"
    assert payment.amount == 120.0
    assert payment.status == "SUCCESS"
    assert payment.payment_method_type == "DIGITAL_WALLET"
    assert payment.failure_reason is None
    assert payment.created_at == "2026-09-12T12:00:00Z"


def test_get_payment_case_and_whitespace_insensitivity():
    """Verify payment ID lookup handles casing and whitespace gracefully."""
    payment = get_payment("  pay-1001  ")
    assert payment.payment_id == "PAY-1001"
    assert payment.amount == 120.0


def test_get_nonexistent_payment():
    """Verify querying a non-existent payment raises PaymentNotFoundError."""
    with pytest.raises(PaymentNotFoundError) as exc_info:
        get_payment("PAY-9999")
    assert "PAY-9999" in str(exc_info.value)


def test_get_payment_invalid_format():
    """Verify invalid payment ID formats raise ValueError."""
    with pytest.raises(ValueError) as exc_info:
        get_payment("BAD-PAY-ID")
    assert "Invalid payment ID format" in str(exc_info.value)
