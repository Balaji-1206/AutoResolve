"""
Unit tests for LangGraph InvestigationState and state factory.
"""

from datetime import datetime
import operator
import pytest
from app.models.resolution import (
    BusinessDecision,
    InvestigationRequest,
    InvestigationStatus,
    OperationalEvidence,
    PolicyEvidenceItem,
)
from app.workflows.state import InvestigationState, create_initial_state
from langgraph.graph import StateGraph, START, END


def test_create_initial_state_defaults():
    req = InvestigationRequest(
        ticket_text="My order ORD-1001 was delayed. Can I return it?",
        ticket_id="TCK-1001",
        order_id="ORD-1001",
    )
    state = create_initial_state(req)

    assert state["ticket_text"] == "My order ORD-1001 was delayed. Can I return it?"
    assert state["ticket_id"] == "TCK-1001"
    assert state["order_id"] == "ORD-1001"
    assert state["customer_id"] is None
    assert state["is_safe"] is True
    assert state["safety_threats"] == []
    assert state["policy_evidence"] == []
    assert isinstance(state["operational_evidence"], OperationalEvidence)
    assert state["decision"] == BusinessDecision.UNABLE_TO_DETERMINE
    assert state["requires_human_review"] is False
    assert state["review_reasons"] == []
    assert state["missing_information"] == []
    assert state["errors"] == []
    assert state["status"] == InvestigationStatus.COMPLETED
    assert state["start_time"] > 0
    assert state["final_response"] is None


def test_create_initial_state_with_reference_date():
    ref_date = datetime(2026, 9, 30, 12, 0, 0)
    req = InvestigationRequest(
        ticket_text="Refund inquiry for ORD-1002.",
        order_id="ORD-1002",
    )
    state = create_initial_state(req, reference_date=ref_date)
    assert state["reference_date"] == ref_date


def test_state_reducers_accumulate_correctly():
    """Verifies that Annotated[List[str], operator.add] accumulates across nodes."""
    builder = StateGraph(InvestigationState)

    def node_a(state: InvestigationState) -> dict:
        return {
            "errors": ["Error from node A"],
            "review_reasons": ["Reason from node A"],
            "missing_information": ["Missing item 1"],
        }

    def node_b(state: InvestigationState) -> dict:
        return {
            "errors": ["Error from node B"],
            "review_reasons": ["Reason from node B"],
            "missing_information": ["Missing item 2"],
        }

    builder.add_node("node_a", node_a)
    builder.add_node("node_b", node_b)
    builder.add_edge(START, "node_a")
    builder.add_edge("node_a", "node_b")
    builder.add_edge("node_b", END)

    graph = builder.compile()

    req = InvestigationRequest(ticket_text="Testing reducers", ticket_id="TCK-999")
    init_state = create_initial_state(req)

    result = graph.invoke(init_state)

    # Assert accumulated lists
    assert result["errors"] == ["Error from node A", "Error from node B"]
    assert result["review_reasons"] == ["Reason from node A", "Reason from node B"]
    assert result["missing_information"] == ["Missing item 1", "Missing item 2"]

