"""
Tests for Action Execution Data Models and Schema Definitions.
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

from app.models.tool import (
    RefundExecutionRequest,
    RefundExecutionResponse,
    OrderStatusUpdateRequest,
    ShippingLabelRequest,
    ShippingLabelResponse,
)
from app.database import get_db_connection


def test_action_models_instantiation():
    req = RefundExecutionRequest(
        order_id="ORD-1001",
        customer_id="CUS-1001",
        amount=120.0,
        reason="Damaged item",
    )
    assert req.order_id == "ORD-1001"
    assert req.amount == 120.0

    res = RefundExecutionResponse(
        refund_id="REF-1001",
        order_id="ORD-1001",
        customer_id="CUS-1001",
        amount=120.0,
        status="PROCESSED",
        gateway_transaction_id="tx_mock_123456",
        processed_at="2026-11-18 10:00:00",
        message="Refund successfully processed.",
    )
    assert res.gateway_transaction_id == "tx_mock_123456"

    label_req = ShippingLabelRequest(order_id="ORD-1001", customer_id="CUS-1001")
    assert label_req.carrier == "UPS Ground"

    label_res = ShippingLabelResponse(
        shipment_id="SHP-1001",
        order_id="ORD-1001",
        customer_id="CUS-1001",
        carrier="UPS Ground",
        tracking_number="1Z999AA10123456784",
        status="LABEL_CREATED",
        label_url="/labels/SHP-1001.pdf",
        created_at="2026-11-18 10:00:00",
    )
    assert label_res.tracking_number.startswith("1Z")


def test_return_shipments_table_exists():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='return_shipments';")
    row = cursor.fetchone()
    conn.close()
    assert row is not None, "Table 'return_shipments' should exist in database."
