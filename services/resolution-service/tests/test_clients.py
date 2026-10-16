"""
Unit tests for RAGClient and ToolClient using httpx.MockTransport.

Ensures that client adapters handle 200 OK, 404 Not Found, 400 Bad Request,
connection failures, timeouts, and 500 errors deterministically without live networks.
"""

import httpx
import pytest
from app.clients.exceptions import ServiceTimeoutError, ServiceUnavailableError
from app.clients.rag_client import RAGClient
from app.clients.tool_client import ToolClient


# ==============================================================================
# RAG Client Tests
# ==============================================================================

@pytest.mark.asyncio
async def test_rag_client_query_success():
    """Verifies that RAGClient successfully queries and deserializes policy response."""
    def handler(request: httpx.Request):
        assert request.url.path == "/api/v1/rag/query"
        return httpx.Response(
            200,
            json={
                "query": "refund policy",
                "answer": "Refunds are allowed within 30 days.",
                "citations": [
                    {
                        "document_id": "POL-REFUND-001",
                        "domain": "refunds",
                        "authority": "authoritative",
                        "section": "Overview",
                        "source": "knowledge/policies/refund_policy.md",
                        "score": 0.89,
                        "explicitly_cited": True,
                    }
                ],
                "retrieved_chunks": [],
                "is_grounded": True,
                "model": "qwen3:8b",
                "status": "SUCCESS",
            },
        )

    mock_client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    rag_client = RAGClient(base_url="http://test-rag", client=mock_client)

    result = await rag_client.query_policy("refund policy", top_k=3)
    assert result["status"] == "SUCCESS"
    assert len(result["citations"]) == 1
    assert result["citations"][0]["document_id"] == "POL-REFUND-001"
    await rag_client.close()


@pytest.mark.asyncio
async def test_rag_client_timeout():
    """Verifies that network timeout is caught and translated to ServiceTimeoutError."""
    def handler(request: httpx.Request):
        raise httpx.ReadTimeout("Timeout exceeded")

    mock_client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    rag_client = RAGClient(base_url="http://test-rag", client=mock_client, timeout=2.0)

    with pytest.raises(ServiceTimeoutError) as exc_info:
        await rag_client.query_policy("refund policy")

    assert "RAG Service" in str(exc_info.value)
    assert exc_info.value.status_code == 504
    await rag_client.close()


@pytest.mark.asyncio
async def test_rag_client_connection_error():
    """Verifies that connection refusal is caught and translated to ServiceUnavailableError."""
    def handler(request: httpx.Request):
        raise httpx.ConnectError("Connection refused")

    mock_client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    rag_client = RAGClient(base_url="http://test-rag", client=mock_client)

    with pytest.raises(ServiceUnavailableError) as exc_info:
        await rag_client.query_policy("refund policy")

    assert "Connection failed" in str(exc_info.value)
    assert exc_info.value.status_code == 503
    await rag_client.close()


@pytest.mark.asyncio
async def test_rag_client_500_error():
    """Verifies that upstream 500 error raises ServiceUnavailableError."""
    def handler(request: httpx.Request):
        return httpx.Response(500, text="Internal Server Error")

    mock_client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    rag_client = RAGClient(base_url="http://test-rag", client=mock_client)

    with pytest.raises(ServiceUnavailableError) as exc_info:
        await rag_client.query_policy("refund policy")

    assert "HTTP 500" in str(exc_info.value)
    await rag_client.close()


@pytest.mark.asyncio
async def test_rag_client_health():
    """Verifies health check probe."""
    def handler(request: httpx.Request):
        return httpx.Response(200, json={"status": "healthy"})

    mock_client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    rag_client = RAGClient(base_url="http://test-rag", client=mock_client)

    assert await rag_client.check_health() is True
    await rag_client.close()


# ==============================================================================
# Tool Client Tests
# ==============================================================================

@pytest.mark.asyncio
async def test_tool_client_get_order_success():
    """Verifies successful retrieval of order details."""
    def handler(request: httpx.Request):
        assert request.url.path == "/api/v1/tools/orders/ORD-1001"
        return httpx.Response(
            200,
            json={
                "order_id": "ORD-1001",
                "customer_id": "CUS-1001",
                "status": "DELIVERED",
                "total_amount": 120.0,
                "currency": "USD",
                "order_date": "2026-09-12T12:00:00Z",
                "delivery_date": "2026-09-16T12:00:00Z",
                "shipping_status": "DELIVERED",
                "product_category": "Apparel",
                "payment_id": "PAY-1001",
                "refundable": True,
            },
        )

    mock_client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    tool_client = ToolClient(base_url="http://test-tools", client=mock_client)

    order = await tool_client.get_order("ORD-1001")
    assert order is not None
    assert order["order_id"] == "ORD-1001"
    assert order["status"] == "DELIVERED"
    assert order["total_amount"] == 120.0
    await tool_client.close()


@pytest.mark.asyncio
async def test_tool_client_get_order_404_returns_none():
    """Verifies that missing order returns None rather than raising an unhandled exception."""
    def handler(request: httpx.Request):
        return httpx.Response(404, json={"detail": "Order not found"})

    mock_client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    tool_client = ToolClient(base_url="http://test-tools", client=mock_client)

    order = await tool_client.get_order("ORD-9999")
    assert order is None
    await tool_client.close()


@pytest.mark.asyncio
async def test_tool_client_get_customer_success():
    """Verifies successful retrieval of customer profile."""
    def handler(request: httpx.Request):
        assert request.url.path == "/api/v1/tools/customers/CUS-1001"
        return httpx.Response(
            200,
            json={
                "customer_id": "CUS-1001",
                "name": "Aarav Kumar",
                "email": "aarav.kumar@example.com",
                "account_status": "ACTIVE",
                "billing_zip": "10001",
                "phone_last4": "1234",
                "created_at": "2025-01-01T00:00:00Z",
            },
        )

    mock_client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    tool_client = ToolClient(base_url="http://test-tools", client=mock_client)

    customer = await tool_client.get_customer("CUS-1001")
    assert customer is not None
    assert customer["customer_id"] == "CUS-1001"
    assert customer["name"] == "Aarav Kumar"
    await tool_client.close()


@pytest.mark.asyncio
async def test_tool_client_get_payment_and_refund():
    """Verifies payment and refund lookup methods."""
    def handler(request: httpx.Request):
        if "payments" in request.url.path:
            return httpx.Response(
                200,
                json={"payment_id": "PAY-1001", "order_id": "ORD-1001", "status": "SUCCESS", "amount": 120.0},
            )
        elif "refunds" in request.url.path:
            return httpx.Response(
                200,
                json={"refund_id": "REF-1001", "order_id": "ORD-1001", "status": "COMPLETED", "amount": 120.0},
            )
        return httpx.Response(404)

    mock_client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    tool_client = ToolClient(base_url="http://test-tools", client=mock_client)

    payment = await tool_client.get_payment("PAY-1001")
    assert payment["payment_id"] == "PAY-1001"

    refund = await tool_client.get_refund("REF-1001")
    assert refund["refund_id"] == "REF-1001"
    await tool_client.close()


@pytest.mark.asyncio
async def test_tool_client_400_raises_value_error():
    """Verifies that 400 Bad Request raises ValueError."""
    def handler(request: httpx.Request):
        return httpx.Response(400, json={"detail": "Invalid order ID format"})

    mock_client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    tool_client = ToolClient(base_url="http://test-tools", client=mock_client)

    with pytest.raises(ValueError) as exc_info:
        await tool_client.get_order("INVALID")

    assert "Malformed order identifier" in str(exc_info.value)
    await tool_client.close()


@pytest.mark.asyncio
async def test_tool_client_timeout():
    """Verifies that ToolClient raises ServiceTimeoutError on timeout."""
    def handler(request: httpx.Request):
        raise httpx.ReadTimeout("Timeout exceeded")

    mock_client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    tool_client = ToolClient(base_url="http://test-tools", client=mock_client, timeout=1.5)

    with pytest.raises(ServiceTimeoutError) as exc_info:
        await tool_client.get_order("ORD-1001")

    assert "Tool Service" in str(exc_info.value)
    assert exc_info.value.status_code == 504
    await tool_client.close()


@pytest.mark.asyncio
async def test_tool_client_connection_error():
    """Verifies that connection refusal raises ServiceUnavailableError."""
    def handler(request: httpx.Request):
        raise httpx.ConnectError("Connection refused")

    mock_client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    tool_client = ToolClient(base_url="http://test-tools", client=mock_client)

    with pytest.raises(ServiceUnavailableError) as exc_info:
        await tool_client.get_order("ORD-1001")

    assert "Connection failed" in str(exc_info.value)
    assert exc_info.value.status_code == 503
    await tool_client.close()
