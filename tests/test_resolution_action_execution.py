"""
Unit tests for Resolution Service Phase 2 Automated Action Execution.
Verifies that authoritative mutations (refunds, labels) execute ONLY when
decision == ELIGIBLE and requires_human_review == False.
"""

import os
import sys
from unittest.mock import AsyncMock, MagicMock
import pytest

# Ensure services/resolution-service is isolated on Python path
RES_DIR = os.path.abspath("services/resolution-service")
for mod in list(sys.modules.keys()):
    if mod == "app" or mod.startswith("app."):
        del sys.modules[mod]
if RES_DIR in sys.path:
    sys.path.remove(RES_DIR)
sys.path.insert(0, RES_DIR)

from app.models.resolution import (
    BusinessDecision,
    InvestigationRequest,
    InvestigationResponse,
    InvestigationStatus,
    OperationalEvidence,
)
from app.workflows.investigation import InvestigationWorkflow


@pytest.mark.asyncio
async def test_automated_actions_executed_when_eligible_and_no_human_review():
    """Verify that eligible decisions without human review trigger refund and shipping label actions."""
    mock_rag = MagicMock()
    mock_tools = MagicMock()
    mock_tools.execute_refund = AsyncMock(return_value={
        "success": True,
        "refund_id": "REF-AUTO-999",
        "gateway_transaction_id": "tx_mock_abc123",
        "amount": 149.99,
        "status": "PROCESSED",
    })
    mock_tools.generate_shipping_label = AsyncMock(return_value={
        "success": True,
        "shipment_id": "SHP-AUTO-888",
        "tracking_number": "1Z999AA10123456784",
        "carrier": "UPS Ground",
    })
    mock_tools.close = AsyncMock()
    mock_rag.close = AsyncMock()

    workflow = InvestigationWorkflow(rag_client=mock_rag, tool_client=mock_tools)

    # Mock the LangGraph ainvoke output to simulate Phase 1 producing ELIGIBLE
    mock_response = InvestigationResponse(
        ticket_id="TCK-9001",
        status=InvestigationStatus.COMPLETED,
        decision=BusinessDecision.ELIGIBLE,
        summary="Customer within 30-day window with undamaged item.",
        reasoning_summary="Eligible for full refund.",
        requires_human_review=False,
        review_reasons=[],
        actions_taken=[],
        operational_evidence=OperationalEvidence(
            order={"order_id": "ORD-1001", "total_amount": 149.99},
            customer={"customer_id": "CUS-1001"},
        ),
        duration_ms=50.0,
    )
    workflow.graph = MagicMock()
    workflow.graph.ainvoke = AsyncMock(return_value={"final_response": mock_response})

    req = InvestigationRequest(
        ticket_id="TCK-9001",
        ticket_text="Return my defective keyboard",
        order_id="ORD-1001",
        customer_id="CUS-1001",
    )

    result = await workflow.investigate(req)

    # Verify tool client write operations were called
    mock_tools.execute_refund.assert_awaited_once_with(
        order_id="ORD-1001",
        customer_id="CUS-1001",
        amount=149.99,
        reason="Automated resolution for ticket TCK-9001: Customer within 30-day window with undamaged item.",
    )
    mock_tools.generate_shipping_label.assert_awaited_once_with(
        order_id="ORD-1001",
        customer_id="CUS-1001",
        carrier="UPS Ground",
    )

    # Verify response was enriched with action details
    assert any("REFUND_EXECUTED" in a for a in result.actions_taken)
    assert any("RETURN_LABEL_ISSUED" in a for a in result.actions_taken)
    assert "tx_mock_abc123" in result.summary
    assert "1Z999AA10123456784" in result.summary


@pytest.mark.asyncio
async def test_automated_actions_NOT_executed_when_requires_human_review():
    """Verify high-value or escalated cases DO NOT trigger financial or shipping writes."""
    mock_rag = MagicMock()
    mock_tools = MagicMock()
    mock_tools.execute_refund = AsyncMock()
    mock_tools.generate_shipping_label = AsyncMock()
    mock_tools.close = AsyncMock()
    mock_rag.close = AsyncMock()

    workflow = InvestigationWorkflow(rag_client=mock_rag, tool_client=mock_tools)

    # High value case requiring human review
    mock_response = InvestigationResponse(
        ticket_id="TCK-9002",
        status=InvestigationStatus.COMPLETED,
        decision=BusinessDecision.ELIGIBLE,
        summary="High-value laptop return request.",
        reasoning_summary="Eligible but order value exceeds $500 threshold.",
        requires_human_review=True,
        review_reasons=["High-value transaction ($1,299.99) requires supervisor approval."],
        actions_taken=[],
        operational_evidence=OperationalEvidence(
            order={"order_id": "ORD-9002", "total_amount": 1299.99},
            customer={"customer_id": "CUS-9002"},
        ),
        duration_ms=65.0,
    )
    workflow.graph = MagicMock()
    workflow.graph.ainvoke = AsyncMock(return_value={"final_response": mock_response})

    req = InvestigationRequest(
        ticket_id="TCK-9002",
        ticket_text="Return my $1300 laptop",
        order_id="ORD-9002",
        customer_id="CUS-9002",
    )

    result = await workflow.investigate(req)

    # Assert no write tools were called!
    mock_tools.execute_refund.assert_not_awaited()
    mock_tools.generate_shipping_label.assert_not_awaited()
    assert len(result.actions_taken) == 0
