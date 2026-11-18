"""
Tests for Tool Service SQLite Database Integration.
"""

import os
import sys
import pytest

# Ensure services/tool-service is isolated on Python path
TOOL_SERVICE_DIR = os.path.abspath("services/tool-service")
for mod in list(sys.modules.keys()):
    if mod == "app" or mod.startswith("app."):
        del sys.modules[mod]
if TOOL_SERVICE_DIR in sys.path:
    sys.path.remove(TOOL_SERVICE_DIR)
sys.path.insert(0, TOOL_SERVICE_DIR)

from app.database import get_db_connection
from app.tools.orders import get_order, list_orders, OrderNotFoundError
from app.tools.customer import get_customer, CustomerNotFoundError
from app.tools.payments import get_payment, PaymentNotFoundError
from app.tools.refunds import get_refund, create_or_update_refund, RefundNotFoundError


def test_get_order_from_db():
    order = get_order("ORD-1001")
    assert order.order_id == "ORD-1001"
    assert order.customer_id == "CUS-1001"
    assert order.total_amount > 0
    assert order.status in ("DELIVERED", "REFUNDED", "RETURN_INITIATED")


def test_list_orders_from_db():
    orders = list_orders("CUS-1001")
    assert len(orders) > 0
    assert all(o.customer_id == "CUS-1001" for o in orders)


def test_get_customer_from_db():
    customer = get_customer("CUS-1001")
    assert customer.customer_id == "CUS-1001"
    assert customer.name is not None
    assert "@" in customer.email


def test_get_payment_from_db():
    payment = get_payment("PAY-1001")
    assert payment.payment_id == "PAY-1001"
    assert payment.order_id == "ORD-1001"


def test_create_and_get_refund_in_db():
    refund = create_or_update_refund(
        refund_id="REF-TEST-9999",
        order_id="ORD-1001",
        customer_id="CUS-1001",
        amount=120.0,
        status="PROCESSED",
        reason="Customer returned damaged shoes",
    )
    assert refund.refund_id == "REF-TEST-9999"

    retrieved = get_refund("REF-TEST-9999")
    assert retrieved.refund_id == "REF-TEST-9999"
    assert retrieved.amount == 120.0
    assert retrieved.status == "PROCESSED"
