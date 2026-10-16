"""
Integration Tests for Tool Service FastAPI Application.
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    """Verify health endpoint returns 200 OK and healthy status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "Tool Service" in data.get("service", "")


def test_get_order_api_success():
    """Verify GET /api/v1/tools/orders/{order_id} returns 200 and mapped fields."""
    response = client.get("/api/v1/tools/orders/ORD-1001")
    assert response.status_code == 200
    data = response.json()
    assert data["order_id"] == "ORD-1001"
    assert data["customer_id"] == "CUS-1001"
    assert data["status"] == "DELIVERED"
    assert data["total_amount"] == 120.0
    assert data["currency"] == "USD"
    assert data["order_date"] == "2026-09-12T12:00:00Z"
    assert data["delivery_date"] == "2026-09-16T12:00:00Z"


def test_get_order_blueprint_example():
    """Verify GET /api/v1/tools/orders/ORD-0001 matches user blueprint example."""
    response = client.get("/api/v1/tools/orders/ORD-0001")
    assert response.status_code == 200
    data = response.json()
    assert data["order_id"] == "ORD-0001"
    assert data["customer_id"] == "CUS-0001"
    assert data["status"] == "DELIVERED"
    assert data["total_amount"] == 249.99
    assert data["order_date"] == "2026-09-20"
    assert data["delivery_date"] == "2026-09-24"


def test_get_order_api_not_found():
    """Verify GET /api/v1/tools/orders/{order_id} returns 404 for unknown order."""
    response = client.get("/api/v1/tools/orders/ORD-9999")
    assert response.status_code == 404
    data = response.json()
    assert "not found" in data["detail"].lower()


def test_get_order_api_invalid_format():
    """Verify GET /api/v1/tools/orders/{order_id} returns 400 for malformed order ID."""
    response = client.get("/api/v1/tools/orders/INVALID-ID")
    assert response.status_code == 400
    data = response.json()
    assert "invalid" in data["detail"].lower()


# -------------------------------------------------------------
# Customer API Tests
# -------------------------------------------------------------

def test_get_customer_api_success():
    """Verify GET /api/v1/tools/customers/{customer_id} returns 200 OK."""
    response = client.get("/api/v1/tools/customers/CUS-1001")
    assert response.status_code == 200
    data = response.json()
    assert data["customer_id"] == "CUS-1001"
    assert data["name"] == "Aarav Kumar"
    assert data["account_status"] == "ACTIVE"


def test_get_customer_api_not_found():
    """Verify GET /api/v1/tools/customers/{customer_id} returns 404 for unknown customer."""
    response = client.get("/api/v1/tools/customers/CUS-9999")
    assert response.status_code == 404
    data = response.json()
    assert "not found" in data["detail"].lower()


def test_get_customer_api_invalid_format():
    """Verify GET /api/v1/tools/customers/{customer_id} returns 400 for invalid ID format."""
    response = client.get("/api/v1/tools/customers/INVALID_CUSTOMER")
    assert response.status_code == 400
    data = response.json()
    assert "invalid" in data["detail"].lower()


# -------------------------------------------------------------
# Payment API Tests
# -------------------------------------------------------------

def test_get_payment_api_success():
    """Verify GET /api/v1/tools/payments/{payment_id} returns 200 OK."""
    response = client.get("/api/v1/tools/payments/PAY-1001")
    assert response.status_code == 200
    data = response.json()
    assert data["payment_id"] == "PAY-1001"
    assert data["order_id"] == "ORD-1001"
    assert data["amount"] == 120.0
    assert data["status"] == "SUCCESS"


def test_get_payment_api_not_found():
    """Verify GET /api/v1/tools/payments/{payment_id} returns 404 for unknown payment."""
    response = client.get("/api/v1/tools/payments/PAY-9999")
    assert response.status_code == 404
    data = response.json()
    assert "not found" in data["detail"].lower()


def test_get_payment_api_invalid_format():
    """Verify GET /api/v1/tools/payments/{payment_id} returns 400 for invalid ID format."""
    response = client.get("/api/v1/tools/payments/BAD_PAY_ID")
    assert response.status_code == 400
    data = response.json()
    assert "invalid" in data["detail"].lower()


# -------------------------------------------------------------
# Refund API Tests
# -------------------------------------------------------------

def test_get_refund_api_success():
    """Verify GET /api/v1/tools/refunds/{refund_id} returns 200 OK."""
    response = client.get("/api/v1/tools/refunds/REF-1001")
    assert response.status_code == 200
    data = response.json()
    assert data["refund_id"] == "REF-1001"
    assert data["order_id"] == "ORD-1004"
    assert data["amount"] == 60.0
    assert data["status"] == "COMPLETED"


def test_get_refund_api_not_found():
    """Verify GET /api/v1/tools/refunds/{refund_id} returns 404 for unknown refund."""
    response = client.get("/api/v1/tools/refunds/REF-9999")
    assert response.status_code == 404
    data = response.json()
    assert "not found" in data["detail"].lower()


def test_get_refund_api_invalid_format():
    """Verify GET /api/v1/tools/refunds/{refund_id} returns 400 for invalid ID format."""
    response = client.get("/api/v1/tools/refunds/BAD_REF_ID")
    assert response.status_code == 400
    data = response.json()
    assert "invalid" in data["detail"].lower()


# -------------------------------------------------------------
# Tool Calling Endpoint Tests
# -------------------------------------------------------------

def test_post_tools_query_api():
    """Verify POST /api/v1/tools/query invokes tool agent and returns result."""
    from unittest.mock import patch, AsyncMock
    from app.tools.agent import ToolCallingResult

    mock_result = ToolCallingResult(
        query="Where is order ORD-1001?",
        answer="Your order ORD-1001 was delivered on September 16, 2026.",
        tools_executed=[{"tool_name": "get_order", "arguments": {"order_id": "ORD-1001"}}],
        model="qwen3:8b",
        duration_ms=45.0,
    )

    with patch("app.tools.agent.QwenToolAgent.run_async", new_callable=AsyncMock) as mock_run:
        mock_run.return_value = mock_result
        response = client.post("/api/v1/tools/query", json={"query": "Where is order ORD-1001?"})

    assert response.status_code == 200
    data = response.json()
    assert data["query"] == "Where is order ORD-1001?"
    assert "ORD-1001" in data["answer"]
    assert len(data["tools_executed"]) == 1
    assert data["tools_executed"][0]["tool_name"] == "get_order"


