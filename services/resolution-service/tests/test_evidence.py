"""
Unit tests for the EvidenceCollector workflow.
"""

import httpx
import pytest
from app.clients.rag_client import RAGClient
from app.clients.tool_client import ToolClient
from app.models.resolution import InvestigationRequest
from app.workflows.evidence import EvidenceCollector


@pytest.mark.asyncio
async def test_collect_evidence_full_relational_traversal():
    """
    Verifies that when an order is discovered, EvidenceCollector automatically
    traverses foreign keys to pull the customer profile and payment record.
    """
    def rag_handler(request: httpx.Request):
        return httpx.Response(
            200,
            json={
                "query": "refund eligibility",
                "answer": "Policy POL-REFUND-001 allows returns within 30 days.",
                "citations": [
                    {
                        "document_id": "POL-REFUND-001",
                        "domain": "refunds",
                        "authority": "authoritative",
                        "section": "Standard Refund Window",
                        "source": "knowledge/policies/refund_policy.md",
                        "score": 0.88,
                        "explicitly_cited": True,
                    }
                ],
                "retrieved_chunks": [
                    {
                        "document_id": "POL-REFUND-001",
                        "section": "Standard Refund Window",
                        "score": 0.88,
                        "snippet": "Customers may return items within 30 days.",
                    }
                ],
                "is_grounded": True,
                "model": "qwen3:8b",
                "status": "SUCCESS",
            },
        )

    def tool_handler(request: httpx.Request):
        path = request.url.path
        if "/orders/ORD-1001" in path:
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
                    "payment_id": "PAY-1001",
                    "product_category": "Apparel",
                    "refundable": True,
                },
            )
        elif "/customers/CUS-1001" in path:
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
        elif "/payments/PAY-1001" in path:
            return httpx.Response(
                200,
                json={
                    "payment_id": "PAY-1001",
                    "order_id": "ORD-1001",
                    "customer_id": "CUS-1001",
                    "amount": 120.0,
                    "status": "SUCCESS",
                    "payment_method_type": "CREDIT_CARD",
                    "created_at": "2026-09-12T12:00:00Z",
                },
            )
        return httpx.Response(404)

    rag_client = RAGClient(base_url="http://mock-rag", client=httpx.AsyncClient(transport=httpx.MockTransport(rag_handler)))
    tool_client = ToolClient(base_url="http://mock-tools", client=httpx.AsyncClient(transport=httpx.MockTransport(tool_handler)))

    collector = EvidenceCollector(rag_client=rag_client, tool_client=tool_client)

    request = InvestigationRequest(
        ticket_text="My order ORD-1001 was delivered. Can I get a refund?",
        ticket_id="TCK-1001",
    )

    evidence = await collector.collect_evidence(request)

    assert evidence.ticket_id == "TCK-1001"
    assert len(evidence.policy_evidence) == 1
    assert evidence.policy_evidence[0].document_id == "POL-REFUND-001"

    # Operational evidence and relationship traversal checks
    assert evidence.operational_evidence.order is not None
    assert evidence.operational_evidence.order["order_id"] == "ORD-1001"

    assert evidence.operational_evidence.customer is not None
    assert evidence.operational_evidence.customer["customer_id"] == "CUS-1001"

    assert evidence.operational_evidence.payment is not None
    assert evidence.operational_evidence.payment["payment_id"] == "PAY-1001"

    assert "get_order" in evidence.operational_evidence.tools_called
    assert "get_customer" in evidence.operational_evidence.tools_called
    assert "get_payment" in evidence.operational_evidence.tools_called

    assert len(evidence.missing_information) == 0
    assert len(evidence.errors) == 0


@pytest.mark.asyncio
async def test_collect_evidence_missing_order_id():
    """Verifies that missing order ID is accurately recorded in missing_information."""
    def rag_handler(request: httpx.Request):
        return httpx.Response(200, json={"query": "refund", "citations": [], "status": "SUCCESS"})

    rag_client = RAGClient(base_url="http://mock-rag", client=httpx.AsyncClient(transport=httpx.MockTransport(rag_handler)))
    tool_client = ToolClient(base_url="http://mock-tools", client=httpx.AsyncClient(transport=httpx.MockTransport(lambda r: httpx.Response(404))))

    collector = EvidenceCollector(rag_client=rag_client, tool_client=tool_client)

    request = InvestigationRequest(ticket_text="How can I request a refund for a damaged item?")
    evidence = await collector.collect_evidence(request)

    assert any("Order identifier" in m for m in evidence.missing_information)
    assert evidence.operational_evidence.order is None


@pytest.mark.asyncio
async def test_collect_evidence_order_not_found():
    """Verifies that an order ID resulting in 404 is documented in missing_information."""
    def rag_handler(request: httpx.Request):
        return httpx.Response(200, json={"query": "refund", "citations": [], "status": "SUCCESS"})

    def tool_handler(request: httpx.Request):
        return httpx.Response(404, json={"detail": "Order not found"})

    rag_client = RAGClient(base_url="http://mock-rag", client=httpx.AsyncClient(transport=httpx.MockTransport(rag_handler)))
    tool_client = ToolClient(base_url="http://mock-tools", client=httpx.AsyncClient(transport=httpx.MockTransport(tool_handler)))

    collector = EvidenceCollector(rag_client=rag_client, tool_client=tool_client)

    request = InvestigationRequest(ticket_text="Checking on order ORD-9999.")
    evidence = await collector.collect_evidence(request)

    assert any("ORD-9999" in m and "not found" in m for m in evidence.missing_information)
    assert "get_order" in evidence.operational_evidence.tools_called


@pytest.mark.asyncio
async def test_collect_evidence_rag_degraded():
    """Verifies that if RAG fails, the collector records the error and preserves operational data."""
    def rag_handler(request: httpx.Request):
        return httpx.Response(503, text="RAG cluster unavailable")

    def tool_handler(request: httpx.Request):
        return httpx.Response(200, json={"order_id": "ORD-1001", "status": "DELIVERED"})

    rag_client = RAGClient(base_url="http://mock-rag", client=httpx.AsyncClient(transport=httpx.MockTransport(rag_handler)))
    tool_client = ToolClient(base_url="http://mock-tools", client=httpx.AsyncClient(transport=httpx.MockTransport(tool_handler)))

    collector = EvidenceCollector(rag_client=rag_client, tool_client=tool_client)

    request = InvestigationRequest(ticket_text="Refund on ORD-1001.")
    evidence = await collector.collect_evidence(request)

    assert len(evidence.errors) == 1
    assert "Policy retrieval degraded" in evidence.errors[0]
    assert evidence.operational_evidence.order is not None
