"""
Unit tests for Resolution Service Admin Review & Decision Endpoints.
"""

from datetime import datetime
import json
import os
import sys
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from fastapi.testclient import TestClient

# Ensure services/resolution-service is isolated on Python path
RES_DIR = os.path.abspath("services/resolution-service")
for mod in list(sys.modules.keys()):
    if mod == "app" or mod.startswith("app."):
        del sys.modules[mod]
if RES_DIR in sys.path:
    sys.path.remove(RES_DIR)
sys.path.insert(0, RES_DIR)

from app.database import save_ticket, save_supervisor_alert, get_ticket
from app.api import admin as admin_module
from app.main import app as resolution_app


@pytest.fixture
def client():
    return TestClient(resolution_app)


def test_admin_list_pending_reviews(client):
    """Verify listing pending supervisor reviews."""
    ticket_id = f"TCK-REV-{int(datetime.utcnow().timestamp())}"
    save_ticket({
        "ticket_id": ticket_id,
        "order_id": "ORD-1002",
        "customer_id": "CUS-1002",
        "customer_message": "Returning $1,299 laptop",
        "decision": "NEEDS_HUMAN_REVIEW",
        "status": "PENDING_REVIEW",
        "summary": "Escalated for manager approval",
        "reasoning_summary": "Order > $500 threshold",
        "requires_human_review": 1,
        "review_reasons": json.dumps(["Order value exceeds $500 threshold"]),
        "duration_ms": 75.0,
    })

    res = client.get("/api/v1/resolution/admin/reviews")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert any(t["ticket_id"] == ticket_id for t in data)


def test_admin_list_alerts(client):
    """Verify fetching asynchronous alert feed."""
    alert_id = f"ALT-ADM-{int(datetime.utcnow().timestamp())}"
    save_supervisor_alert({
        "alert_id": alert_id,
        "ticket_id": "TCK-1002",
        "order_id": "ORD-1002",
        "customer_id": "CUS-1002",
        "channel": "slack:#support-escalations",
        "severity": "HIGH",
        "title": "High Value Review Required",
        "message": "Please review order ORD-1002",
        "status": "DELIVERED",
        "payload": "{}",
    })

    res = client.get("/api/v1/resolution/admin/alerts")
    assert res.status_code == 200
    alerts = res.json()
    assert isinstance(alerts, list)
    assert any(a["alert_id"] == alert_id for a in alerts)


def test_admin_decision_approve(client):
    """Verify supervisor approval executes Phase 2 refund and return label."""
    ticket_id = f"TCK-APP-{int(datetime.utcnow().timestamp())}"
    save_ticket({
        "ticket_id": ticket_id,
        "order_id": "ORD-1001",
        "customer_id": "CUS-1001",
        "customer_message": "Need refund approved by manager",
        "decision": "NEEDS_HUMAN_REVIEW",
        "status": "PENDING_REVIEW",
        "summary": "Pending approval",
        "reasoning_summary": "Policy exception requested",
        "requires_human_review": 1,
        "review_reasons": json.dumps(["Manager discretion requested"]),
        "duration_ms": 60.0,
    })

    # Mock tool client write methods
    with patch.object(admin_module, "get_tool_client") as mock_get_client:
        mock_tool_client = AsyncMock()
        mock_tool_client.execute_refund = AsyncMock(return_value={
            "success": True,
            "refund_id": "REF-SUP-101",
            "gateway_transaction_id": "tx_mock_admin_123",
            "amount": 120.0,
            "status": "PROCESSED",
        })
        mock_tool_client.generate_shipping_label = AsyncMock(return_value={
            "success": True,
            "shipment_id": "SHP-SUP-101",
            "tracking_number": "1Z999AA10999999999",
            "carrier": "UPS Ground",
        })
        mock_get_client.return_value = mock_tool_client

        payload = {
            "action": "APPROVE",
            "reviewer_id": "MGR-SANDHIYA",
            "notes": "Verified defect photos. Override approved.",
        }

        res = client.post(f"/api/v1/resolution/admin/reviews/{ticket_id}/decision", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["status"] == "APPROVED"
        assert "tx_mock_admin_123" in data["summary"]
        assert "1Z999AA10999999999" in data["summary"]

        # Check DB updated
        updated = get_ticket(ticket_id)
        assert updated["decision"] == "ELIGIBLE"
        assert updated["requires_human_review"] == 0


def test_admin_decision_reject(client):
    """Verify supervisor rejection updates ticket without executing refunds."""
    ticket_id = f"TCK-REJ-{int(datetime.utcnow().timestamp())}"
    save_ticket({
        "ticket_id": ticket_id,
        "order_id": "ORD-1002",
        "customer_id": "CUS-1002",
        "customer_message": "Refund please",
        "decision": "NEEDS_HUMAN_REVIEW",
        "status": "PENDING_REVIEW",
        "summary": "Pending approval",
        "reasoning_summary": "Out of policy",
        "requires_human_review": 1,
        "review_reasons": json.dumps(["Delivered 65 days ago"]),
        "duration_ms": 40.0,
    })

    payload = {
        "action": "REJECT",
        "reviewer_id": "MGR-SANDHIYA",
        "notes": "Policy strictly limits returns to 30 days. No exception granted.",
    }

    res = client.post(f"/api/v1/resolution/admin/reviews/{ticket_id}/decision", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["status"] == "REJECTED"

    updated = get_ticket(ticket_id)
    assert updated["decision"] == "INELIGIBLE"
    assert updated["requires_human_review"] == 0
