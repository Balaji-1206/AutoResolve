"""
Tests for Resolution Service Ticket Persistence & Checkpointing.
"""

from datetime import datetime
import json
import os
import sys
import pytest

# Ensure services/resolution-service is isolated on Python path
RES_DIR = os.path.abspath("services/resolution-service")
for mod in list(sys.modules.keys()):
    if mod == "app" or mod.startswith("app."):
        del sys.modules[mod]
if RES_DIR in sys.path:
    sys.path.remove(RES_DIR)
sys.path.insert(0, RES_DIR)

from app.database import (
    save_ticket,
    get_ticket,
    list_tickets,
    save_audit_log,
    get_ticket_audit_logs,
)
from app.models.resolution import (
    BusinessDecision,
    InvestigationResponse,
    InvestigationStatus,
    OperationalEvidence,
)
from app.main import app as resolution_app


def test_save_and_retrieve_ticket():
    ticket_id = f"TCK-TEST-{int(datetime.utcnow().timestamp())}"
    ticket_data = {
        "ticket_id": ticket_id,
        "order_id": "ORD-1001",
        "customer_id": "CUS-1001",
        "customer_message": "Item arrived defective, requesting full refund.",
        "decision": "ELIGIBLE",
        "status": "COMPLETED",
        "summary": "Return approved under 30-day guarantee.",
        "reasoning_summary": "Item delivered within window and verified defective.",
        "requires_human_review": 0,
        "review_reasons": json.dumps([]),
        "duration_ms": 124.5,
    }

    save_ticket(ticket_data)

    retrieved = get_ticket(ticket_id)
    assert retrieved is not None
    assert retrieved["ticket_id"] == ticket_id
    assert retrieved["decision"] == "ELIGIBLE"
    assert retrieved["order_id"] == "ORD-1001"


def test_save_and_retrieve_audit_log():
    ticket_id = f"TCK-LOG-{int(datetime.utcnow().timestamp())}"
    ticket_data = {
        "ticket_id": ticket_id,
        "order_id": "ORD-1002",
        "customer_id": "CUS-1002",
        "customer_message": "Exceeded return window inquiry",
        "decision": "INELIGIBLE",
        "status": "COMPLETED",
        "summary": "Return rejected.",
        "reasoning_summary": "Delivered > 30 days ago.",
        "requires_human_review": 0,
        "review_reasons": json.dumps([]),
        "duration_ms": 89.2,
    }
    save_ticket(ticket_data)

    save_audit_log(
        ticket_id=ticket_id,
        node_name="apply_business_rules",
        action="FORCED_OVERRIDE",
        policy_citations=["POL-REFUND-001"],
        operational_snapshot={"order_id": "ORD-1002", "days_since_delivery": 45},
        details="Deterministic rule locked decision to INELIGIBLE.",
    )

    logs = get_ticket_audit_logs(ticket_id)
    assert len(logs) == 1
    assert logs[0]["action"] == "FORCED_OVERRIDE"
    assert "POL-REFUND-001" in logs[0]["policy_citations"]


def test_list_tickets():
    tickets = list_tickets(limit=10)
    assert isinstance(tickets, list)
    assert len(tickets) > 0


def test_api_tickets_endpoints():
    from fastapi.testclient import TestClient

    with TestClient(resolution_app) as client:
        # 1. Test GET /api/v1/resolution/tickets
        resp = client.get("/api/v1/resolution/tickets")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)

        if len(data) > 0:
            sample_id = data[0]["ticket_id"]
            # 2. Test GET /api/v1/resolution/tickets/{ticket_id}
            detail_resp = client.get(f"/api/v1/resolution/tickets/{sample_id}")
            assert detail_resp.status_code == 200
            detail = detail_resp.json()
            assert "ticket" in detail
            assert "audit_logs" in detail
            assert detail["ticket"]["ticket_id"] == sample_id
