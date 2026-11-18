"""
Tests for Tool Service Action Execution Endpoints.
"""

import os
import sys
import pytest

TOOL_SERVICE_DIR = os.path.abspath("services/tool-service")
for mod in list(sys.modules.keys()):
    if mod == "app" or mod.startswith("app."):
        del sys.modules[mod]
if TOOL_SERVICE_DIR in sys.path:
    sys.path.remove(TOOL_SERVICE_DIR)
sys.path.insert(0, TOOL_SERVICE_DIR)

from app.tools.actions import (
    execute_refund_action,
    update_order_status_action,
    generate_shipping_label_action,
)
from app.tools.orders import get_order
from app.tools.refunds import get_refund


def test_execute_refund_action():
    resp = execute_refund_action(
        order_id="ORD-1001",
        customer_id="CUS-1001",
        amount=120.0,
        reason="Defective shoes return approved",
    )
    assert resp.status == "PROCESSED"
    assert resp.gateway_transaction_id.startswith("tx_mock_")
    assert resp.order_id == "ORD-1001"

    # Verify order status was mutated to REFUNDED in database
    updated_order = get_order("ORD-1001")
    assert updated_order.status == "REFUNDED"

    # Verify refund record exists in database
    refund = get_refund(resp.refund_id)
    assert refund.status == "PROCESSED"
    assert refund.amount == 120.0


def test_update_order_status_action():
    updated = update_order_status_action("ORD-1002", "RETURN_INITIATED", reason="Return label printed")
    assert updated.status == "RETURN_INITIATED"

    retrieved = get_order("ORD-1002")
    assert retrieved.status == "RETURN_INITIATED"


def test_generate_shipping_label_action():
    shipment = generate_shipping_label_action("ORD-1001", "CUS-1001", carrier="UPS Ground")
    assert shipment.carrier == "UPS Ground"
    assert shipment.tracking_number.startswith("1Z")
    assert shipment.status == "LABEL_CREATED"
