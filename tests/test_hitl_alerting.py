"""
Unit tests for Asynchronous Human-in-the-Loop (HITL) Alerting.
"""

from datetime import datetime
import os
import sys
from unittest.mock import AsyncMock, patch
import pytest

# Ensure services/resolution-service is on Python path
RES_DIR = os.path.abspath("services/resolution-service")
for mod in list(sys.modules.keys()):
    if mod == "app" or mod.startswith("app."):
        del sys.modules[mod]
if RES_DIR in sys.path:
    sys.path.remove(RES_DIR)
sys.path.insert(0, RES_DIR)

from app.database import (
    save_supervisor_alert,
    list_supervisor_alerts,
    get_pending_reviews,
)
from app.alerts.dispatcher import dispatch_hitl_alert


def test_save_and_list_supervisor_alert():
    """Verify persisting and retrieving supervisor alerts in SQLite."""
    alert_id = f"ALT-TEST-{int(datetime.utcnow().timestamp())}"
    alert_data = {
        "alert_id": alert_id,
        "ticket_id": "TCK-1002",
        "order_id": "ORD-1002",
        "customer_id": "CUS-1002",
        "channel": "slack:#support-escalations",
        "severity": "HIGH",
        "title": "High-Value Transaction Exception ($1,299.99)",
        "message": "Order ORD-1002 total exceeds auto-refund threshold ($500.00).",
        "status": "DELIVERED",
        "payload": '{"order_id": "ORD-1002", "amount": 1299.99}',
    }

    save_supervisor_alert(alert_data)

    alerts = list_supervisor_alerts(limit=10)
    assert any(a["alert_id"] == alert_id for a in alerts)
    saved = next(a for a in alerts if a["alert_id"] == alert_id)
    assert saved["ticket_id"] == "TCK-1002"
    assert saved["severity"] == "HIGH"
    assert saved["status"] == "DELIVERED"


@pytest.mark.asyncio
async def test_dispatch_hitl_alert():
    """Verify dispatch_hitl_alert records to SQLite and generates delivery receipt."""
    receipt = await dispatch_hitl_alert(
        ticket_id="TCK-9999",
        order_id="ORD-9999",
        customer_id="CUS-9999",
        reason="Order amount $1,500.00 requires supervisor approval.",
        amount=1500.00,
        severity="CRITICAL",
    )

    assert receipt["status"] == "DELIVERED"
    assert receipt["channel"] == "slack:#support-escalations"
    assert "alert_id" in receipt

    # Verify persisted in DB
    alerts = list_supervisor_alerts(limit=5)
    matched = [a for a in alerts if a["alert_id"] == receipt["alert_id"]]
    assert len(matched) == 1
    assert matched[0]["ticket_id"] == "TCK-9999"
