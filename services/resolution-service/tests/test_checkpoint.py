"""
Unit and integration tests for Stage 6: Human-in-the-Loop & Durable Checkpoints.

Verifies:
1. High-value transactions (> $500) pause execution at human_review node.
2. State is persisted in MemorySaver under unique thread_id.
3. Resuming with supervisor APPROVE updates decision to ELIGIBLE.
4. Resuming with supervisor REJECT updates decision to INELIGIBLE.
5. Unauthorized supervisor actions raise ValueError.
6. Concurrent threads maintain isolated checkpoints without cross-talk.
7. Read-only invariant (actions_taken = []) is preserved after supervisor approval.
"""

from datetime import datetime
import json
import httpx
from langgraph.checkpoint.memory import MemorySaver
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
def checkpoint_env():
    """Provides mocked RAG, Tool, and Reasoner clients with MemorySaver."""
    def rag_handler(request: httpx.Request):
        return httpx.Response(
            200,
            json={
                "query": "refund",
                "answer": "Policy [POL-REFUND-001] allows returns within 30 days.",
                "citations": [
                    {
                        "document_id": "POL-REFUND-001",
                        "domain": "refunds",
                        "authority": "authoritative",
                        "section": "Standard Window",
                        "source": "knowledge/policies/refund_policy.md",
                        "score": 0.90,
                    }
                ],
            },
        )

    def tool_handler(request: httpx.Request):
        path = request.url.path
        if "/orders/ORD-1002" in path:
            return httpx.Response(
                200,
                json={
                    "order_id": "ORD-1002",
                    "customer_id": "CUS-1002",
                    "status": "DELIVERED",
                    "total_amount": 750.0,
                    "delivered_at": "2026-09-20T12:00:00Z",
                    "product_category": "Electronics",
                    "refundable": True,
                },
            )
        elif "/orders/ORD-1003" in path:
            return httpx.Response(
                200,
                json={
                    "order_id": "ORD-1003",
                    "customer_id": "CUS-1003",
                    "status": "DELIVERED",
                    "total_amount": 900.0,
                    "delivered_at": "2026-09-22T12:00:00Z",
                    "product_category": "Electronics",
                    "refundable": True,
                },
            )
        return httpx.Response(404)

    def ollama_handler(request: httpx.Request):
        return httpx.Response(
            200,
            json={
                "choices": [
                    {
                        "message": {
                            "content": json.dumps({
                                "decision": "ELIGIBLE",
                                "summary": "Customer order is eligible.",
                                "reasoning_summary": "Item delivered within 30 days.",
                            })
                        }
                    }
                ]
            },
        )

    rag = RAGClient(base_url="http://mock-rag", client=httpx.AsyncClient(transport=httpx.MockTransport(rag_handler)))
    tools = ToolClient(base_url="http://mock-tools", client=httpx.AsyncClient(transport=httpx.MockTransport(tool_handler)))
    reasoner = QwenReasoner(base_url="http://mock-ollama", client=httpx.AsyncClient(transport=httpx.MockTransport(ollama_handler)))
    checkpointer = MemorySaver()

    graph = create_resolution_graph(
        rag_client=rag,
        tool_client=tools,
        reasoner=reasoner,
        checkpointer=checkpointer,
    )
    return graph, checkpointer


@pytest.mark.asyncio
async def test_human_review_pause_on_high_value_order(checkpoint_env):
    """High value order ($750) pauses execution at human_review node."""
    graph, checkpointer = checkpoint_env
    thread_id = "thread-high-value-1002"
    config = {"configurable": {"thread_id": thread_id}}

    req = InvestigationRequest(
        ticket_text="I want to return the 4K TV in order ORD-1002.",
        ticket_id="TCK-1002",
    )
    init_state = create_initial_state(req, reference_date=REF_DATE)

    # Stream graph until interrupt
    events = []
    async for event in graph.astream(init_state, config=config):
        events.append(event)

    # Inspect checkpointed state
    snapshot = await graph.aget_state(config)
    assert snapshot.next == ("human_review",)
    assert snapshot.values["order_id"] == "ORD-1002"
    assert snapshot.values["operational_evidence"].order["total_amount"] == 750.0
    assert snapshot.values["decision"] == BusinessDecision.NEEDS_HUMAN_REVIEW
    assert snapshot.values["requires_human_review"] is True
    assert any("$500.00" in r for r in snapshot.values["review_reasons"])


@pytest.mark.asyncio
async def test_supervisor_approval_resume(checkpoint_env):
    """Supervisor APPROVE resumes the graph and converts decision to ELIGIBLE."""
    graph, checkpointer = checkpoint_env
    thread_id = "thread-approval-test"
    config = {"configurable": {"thread_id": thread_id}}

    req = InvestigationRequest(
        ticket_text="I want to return the 4K TV in order ORD-1002.",
        ticket_id="TCK-1002",
    )
    init_state = create_initial_state(req, reference_date=REF_DATE)

    # 1. Run until pause
    async for _ in graph.astream(init_state, config=config):
        pass

    # 2. Supervisor submits review decision into state
    await graph.aupdate_state(
        config,
        {
            "supervisor_review": {
                "action": "APPROVE",
                "reviewer_id": "SUP-77",
                "notes": "VIP customer approved under manager discretion.",
            }
        },
        as_node="apply_business_rules",
    )

    # 3. Resume graph from checkpoint
    await graph.ainvoke(None, config=config)

    # 4. Verify final state
    final_snapshot = await graph.aget_state(config)
    assert final_snapshot.next == ()  # Reached END

    res = final_snapshot.values.get("final_response")
    assert res is not None
    assert res.decision == BusinessDecision.ELIGIBLE
    assert res.requires_human_review is False
    assert "SUP-77" in res.summary
    assert res.actions_taken == []  # Read-only invariant guaranteed

    sup_record = final_snapshot.values.get("supervisor_review")
    assert sup_record["action"] == "APPROVE"
    assert sup_record["reviewer_id"] == "SUP-77"


@pytest.mark.asyncio
async def test_supervisor_rejection_resume(checkpoint_env):
    """Supervisor REJECT resumes the graph and converts decision to INELIGIBLE."""
    graph, checkpointer = checkpoint_env
    thread_id = "thread-rejection-test"
    config = {"configurable": {"thread_id": thread_id}}

    req = InvestigationRequest(
        ticket_text="I want to return order ORD-1002.",
        ticket_id="TCK-1002",
    )
    init_state = create_initial_state(req, reference_date=REF_DATE)

    # Run until pause
    async for _ in graph.astream(init_state, config=config):
        pass

    # Resume with supervisor rejection
    await graph.aupdate_state(
        config,
        {
            "supervisor_review": {
                "action": "REJECT",
                "reviewer_id": "SUP-88",
                "notes": "Policy strictly limits returns over $500 without receipt.",
            }
        },
        as_node="apply_business_rules",
    )

    await graph.ainvoke(None, config=config)

    final_snapshot = await graph.aget_state(config)
    res = final_snapshot.values.get("final_response")
    assert res.decision == BusinessDecision.INELIGIBLE
    assert "declined by operations supervisor" in res.summary.lower()
    assert res.requires_human_review is False


@pytest.mark.asyncio
async def test_unauthorized_supervisor_action_rejected(checkpoint_env):
    """Submitting an invalid action raises ValueError."""
    graph, checkpointer = checkpoint_env
    thread_id = "thread-invalid-action"
    config = {"configurable": {"thread_id": thread_id}}

    req = InvestigationRequest(ticket_text="Return ORD-1002", ticket_id="TCK-1002")
    init_state = create_initial_state(req, reference_date=REF_DATE)

    async for _ in graph.astream(init_state, config=config):
        pass

    # Attempt to bypass with customer-forged action
    await graph.aupdate_state(
        config,
        {
            "supervisor_review": {
                "action": "FORGED_CUSTOMER_ACTION",
                "reviewer_id": "CUSTOMER_ATTACK",
            }
        },
        as_node="apply_business_rules",
    )

    with pytest.raises(ValueError, match="Unauthorized review action"):
        await graph.ainvoke(None, config=config)


@pytest.mark.asyncio
async def test_concurrent_threads_checkpoint_isolation(checkpoint_env):
    """Multiple threads paused concurrently maintain independent checkpoints."""
    graph, checkpointer = checkpoint_env
    cfg_1 = {"configurable": {"thread_id": "thread-isolate-1"}}
    cfg_2 = {"configurable": {"thread_id": "thread-isolate-2"}}

    req1 = InvestigationRequest(ticket_text="Return TV ORD-1002", ticket_id="TCK-1002")
    req2 = InvestigationRequest(ticket_text="Return laptop ORD-1003", ticket_id="TCK-1003")

    # Pause both threads
    async for _ in graph.astream(create_initial_state(req1, reference_date=REF_DATE), config=cfg_1):
        pass
    async for _ in graph.astream(create_initial_state(req2, reference_date=REF_DATE), config=cfg_2):
        pass

    # Resume thread 1 with APPROVE
    await graph.aupdate_state(
        cfg_1,
        {"supervisor_review": {"action": "APPROVE", "reviewer_id": "SUP-1"}},
        as_node="apply_business_rules",
    )
    await graph.ainvoke(None, config=cfg_1)

    # Resume thread 2 with REJECT
    await graph.aupdate_state(
        cfg_2,
        {"supervisor_review": {"action": "REJECT", "reviewer_id": "SUP-2"}},
        as_node="apply_business_rules",
    )
    await graph.ainvoke(None, config=cfg_2)

    snap1 = await graph.aget_state(cfg_1)
    snap2 = await graph.aget_state(cfg_2)

    assert snap1.values["final_response"].decision == BusinessDecision.ELIGIBLE
    assert snap2.values["final_response"].decision == BusinessDecision.INELIGIBLE
