"""
Unit and integration tests for Stage 5: Error Handling and Controlled Recovery.

Verifies:
1. RAG service timeout: preserves tool evidence and sets PARTIAL_EVIDENCE.
2. Tool service timeout: prevents false ELIGIBLE and routes to UNABLE_TO_DETERMINE.
3. Missing record (404): returns NEEDS_MORE_INFORMATION without retrying.
4. Bounded retry: recovers from transient glitch on attempt 2.
5. Malformed LLM output: falls back cleanly to deterministic rules.
"""

from datetime import datetime
import json
import httpx
import pytest
from app.clients.rag_client import RAGClient
from app.clients.tool_client import ToolClient
from app.models.resolution import (
    BusinessDecision,
    InvestigationRequest,
    InvestigationStatus,
)
from app.workflows.graph import create_resolution_graph
from app.workflows.reasoning import QwenReasoner
from app.workflows.state import create_initial_state

REF_DATE = datetime(2026, 9, 30, 12, 0, 0)


@pytest.fixture
def mock_reasoner():
    def ollama_handler(request: httpx.Request):
        return httpx.Response(
            200,
            json={
                "choices": [
                    {
                        "message": {
                            "content": json.dumps({
                                "decision": "ELIGIBLE",
                                "summary": "Order is eligible.",
                                "reasoning_summary": "Policy allows return.",
                            })
                        }
                    }
                ]
            },
        )
    return QwenReasoner(base_url="http://mock-ollama", client=httpx.AsyncClient(transport=httpx.MockTransport(ollama_handler)))


@pytest.mark.asyncio
async def test_rag_service_timeout_preserves_tool_evidence(mock_reasoner):
    """When RAG times out, valid Tool evidence is preserved and status is PARTIAL_EVIDENCE."""
    def failing_rag_handler(request: httpx.Request):
        raise httpx.TimeoutException("RAG timed out")

    def tool_handler(request: httpx.Request):
        return httpx.Response(
            200,
            json={
                "order_id": "ORD-1001",
                "customer_id": "CUS-1001",
                "status": "DELIVERED",
                "total_amount": 120.0,
                "delivered_at": "2026-09-16T12:00:00Z",
                "product_category": "Apparel",
                "refundable": True,
            },
        )

    rag = RAGClient(base_url="http://mock-rag", client=httpx.AsyncClient(transport=httpx.MockTransport(failing_rag_handler)), max_retries=0)
    tools = ToolClient(base_url="http://mock-tools", client=httpx.AsyncClient(transport=httpx.MockTransport(tool_handler)))

    graph = create_resolution_graph(rag_client=rag, tool_client=tools, reasoner=mock_reasoner)
    req = InvestigationRequest(ticket_text="Return shoes in order ORD-1001", ticket_id="TCK-1001")
    init_state = create_initial_state(req, reference_date=REF_DATE)

    final_state = await graph.ainvoke(init_state)
    res = final_state["final_response"]

    assert res.status == InvestigationStatus.PARTIAL_EVIDENCE
    assert res.operational_evidence.order["order_id"] == "ORD-1001"
    assert len(res.policy_evidence) == 0
    assert any("degraded" in err.lower() or "timeout" in err.lower() for err in res.errors)


@pytest.mark.asyncio
async def test_tool_service_timeout_prevents_false_eligible(mock_reasoner):
    """When Tool Service is down, graph must NEVER declare false ELIGIBLE."""
    def rag_handler(request: httpx.Request):
        return httpx.Response(200, json={"query": "refund", "answer": "Policy ok", "citations": []})

    def failing_tool_handler(request: httpx.Request):
        raise httpx.TimeoutException("Tool Service timeout")

    rag = RAGClient(base_url="http://mock-rag", client=httpx.AsyncClient(transport=httpx.MockTransport(rag_handler)))
    tools = ToolClient(base_url="http://mock-tools", client=httpx.AsyncClient(transport=httpx.MockTransport(failing_tool_handler)), max_retries=0)

    graph = create_resolution_graph(rag_client=rag, tool_client=tools, reasoner=mock_reasoner)
    req = InvestigationRequest(ticket_text="Please refund order ORD-1001", ticket_id="TCK-1001")
    init_state = create_initial_state(req, reference_date=REF_DATE)

    final_state = await graph.ainvoke(init_state)
    res = final_state["final_response"]

    # Critical security invariant: NEVER return ELIGIBLE when tools failed
    assert res.decision != BusinessDecision.ELIGIBLE
    assert res.decision == BusinessDecision.UNABLE_TO_DETERMINE
    assert res.status == InvestigationStatus.PARTIAL_EVIDENCE
    assert res.requires_human_review is True


@pytest.mark.asyncio
async def test_missing_order_record_404_handling(mock_reasoner):
    """Unknown order (404) returns NEEDS_MORE_INFORMATION and does not crash."""
    def rag_handler(request: httpx.Request):
        return httpx.Response(200, json={"query": "refund", "answer": "Policy ok", "citations": []})

    def tool_404_handler(request: httpx.Request):
        return httpx.Response(404)

    rag = RAGClient(base_url="http://mock-rag", client=httpx.AsyncClient(transport=httpx.MockTransport(rag_handler)))
    tools = ToolClient(base_url="http://mock-tools", client=httpx.AsyncClient(transport=httpx.MockTransport(tool_404_handler)))

    graph = create_resolution_graph(rag_client=rag, tool_client=tools, reasoner=mock_reasoner)
    req = InvestigationRequest(ticket_text="Refund inquiry for non-existent ORD-9999", ticket_id="TCK-9999")
    init_state = create_initial_state(req, reference_date=REF_DATE)

    final_state = await graph.ainvoke(init_state)
    res = final_state["final_response"]

    assert res.decision == BusinessDecision.NEEDS_MORE_INFORMATION
    assert any("ORD-9999" in m for m in res.missing_information)


@pytest.mark.asyncio
async def test_bounded_retry_recovers_on_second_attempt():
    """ToolClient retries a transient 500 once and succeeds on attempt 2."""
    attempt_count = 0

    def flaky_handler(request: httpx.Request):
        nonlocal attempt_count
        attempt_count += 1
        if attempt_count == 1:
            return httpx.Response(500, text="Internal glitch")
        return httpx.Response(
            200,
            json={"order_id": "ORD-1001", "status": "DELIVERED", "total_amount": 50.0},
        )

    tools = ToolClient(base_url="http://mock-tools", client=httpx.AsyncClient(transport=httpx.MockTransport(flaky_handler)), max_retries=1)
    record = await tools.get_order("ORD-1001")

    assert record is not None
    assert record["order_id"] == "ORD-1001"
    assert attempt_count == 2


@pytest.mark.asyncio
async def test_malformed_llm_output_falls_back_to_rules():
    """When LLM returns non-JSON garbage, graph safely falls back to deterministic decision."""
    def rag_handler(request: httpx.Request):
        return httpx.Response(200, json={"query": "refund", "answer": "Policy ok", "citations": []})

    def tool_handler(request: httpx.Request):
        return httpx.Response(
            200,
            json={
                "order_id": "ORD-1001",
                "customer_id": "CUS-1001",
                "status": "DELIVERED",
                "total_amount": 120.0,
                "delivered_at": "2026-09-16T12:00:00Z",
                "product_category": "Apparel",
                "refundable": True,
            },
        )

    def garbage_llm_handler(request: httpx.Request):
        # LLM returns unparseable conversational chatter
        return httpx.Response(
            200,
            json={
                "choices": [
                    {"message": {"content": "I am not sure what JSON is, but returns seem great!"}}
                ]
            },
        )

    rag = RAGClient(base_url="http://mock-rag", client=httpx.AsyncClient(transport=httpx.MockTransport(rag_handler)))
    tools = ToolClient(base_url="http://mock-tools", client=httpx.AsyncClient(transport=httpx.MockTransport(tool_handler)))
    reasoner = QwenReasoner(base_url="http://mock-ollama", client=httpx.AsyncClient(transport=httpx.MockTransport(garbage_llm_handler)))

    graph = create_resolution_graph(rag_client=rag, tool_client=tools, reasoner=reasoner)
    req = InvestigationRequest(ticket_text="Can I return shoes in order ORD-1001?", ticket_id="TCK-1001")
    init_state = create_initial_state(req, reference_date=REF_DATE)

    final_state = await graph.ainvoke(init_state)
    res = final_state["final_response"]

    # Did not crash, preserved deterministic status and noted LLM parse error
    assert res is not None
    assert res.status == InvestigationStatus.PARTIAL_EVIDENCE
    assert any("parseable JSON" in err for err in res.errors)
