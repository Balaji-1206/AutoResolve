"""
Unit Tests for get_order() Tool in Tool Service.
"""

import pytest
from app.tools.orders import get_order, OrderNotFoundError


def test_get_existing_order():
    """Verify an existing order is successfully retrieved with mapped fields."""
    order = get_order("ORD-1001")
    assert order is not None
    assert order.order_id == "ORD-1001"
    assert order.customer_id == "CUS-1001"
    assert order.status == "DELIVERED"
    assert order.total_amount == 120.0
    assert order.currency == "USD"
    assert order.order_date == "2026-09-12T12:00:00Z"
    assert order.delivery_date == "2026-09-16T12:00:00Z"
    assert order.shipping_status == "DELIVERED"
    assert order.product_category == "Electronics"
    assert order.payment_id == "PAY-1001"
    assert order.refundable is True


def test_get_order_case_and_whitespace_insensitivity():
    """Verify order ID lookup handles casing and whitespace gracefully."""
    order = get_order("  ord-1001  ")
    assert order.order_id == "ORD-1001"
    assert order.customer_id == "CUS-1001"


def test_get_nonexistent_order():
    """Verify querying a non-existent order raises OrderNotFoundError."""
    with pytest.raises(OrderNotFoundError) as exc_info:
        get_order("ORD-9999")
    assert "ORD-9999" in str(exc_info.value)


def test_get_order_invalid_format():
    """Verify invalid order ID formats raise ValueError."""
    with pytest.raises(ValueError) as exc_info:
        get_order("INVALID-FORMAT")
    assert "Invalid order ID format" in str(exc_info.value)
