"""
Master Ticket Investigation Workflow for AutoResolve AI.

Integrates the compiled LangGraph orchestration engine into the Resolution Service,
connecting safety checks, entity extraction, evidence collection (RAG + Tools),
conflict detection, grounded Qwen3 reasoning, and deterministic business rules.
"""

import time
from typing import Any, Dict, Optional
from app.clients.rag_client import RAGClient
from app.clients.tool_client import ToolClient
from app.models.resolution import (
    BusinessDecision,
    InvestigationRequest,
    InvestigationResponse,
    InvestigationStatus,
)
from app.workflows.graph import create_resolution_graph
from app.workflows.reasoning import QwenReasoner
from app.workflows.state import create_initial_state


class InvestigationWorkflow:
    """
    End-to-end investigation orchestrator powered by LangGraph.
    """

    def __init__(
        self,
        rag_client: RAGClient,
        tool_client: ToolClient,
        reasoner: Optional[QwenReasoner] = None,
        checkpointer: Any = None,
    ):
        self.rag_client = rag_client
        self.tool_client = tool_client
        self.reasoner = reasoner or QwenReasoner()
        self.checkpointer = checkpointer
        self.graph = create_resolution_graph(
            rag_client=self.rag_client,
            tool_client=self.tool_client,
            reasoner=self.reasoner,
            checkpointer=self.checkpointer,
        )

    async def investigate(
        self,
        request: InvestigationRequest,
        reference_date: Optional[Any] = None,
        config: Optional[Dict[str, Any]] = None,
    ) -> InvestigationResponse:
        """
        Executes end-to-end investigation orchestrated via the compiled LangGraph.
        Catches any unexpected technical faults to ensure a global fail-safe boundary.
        """
        t0 = time.time()
        try:
            init_state = create_initial_state(request, reference_date=reference_date)
            final_state = await self.graph.ainvoke(init_state, config=config)
            response = final_state.get("final_response")
            if not response:
                raise RuntimeError("Graph execution finished without generating final_response.")
            return response
        except Exception as err:
            dt = round((time.time() - t0) * 1000, 2)
            return InvestigationResponse(
                ticket_id=request.ticket_id,
                status=InvestigationStatus.FAILED,
                decision=BusinessDecision.UNABLE_TO_DETERMINE,
                summary="We encountered an unexpected technical issue while assessing your inquiry. A support representative will assist you.",
                reasoning_summary="Internal investigation failure occurred during workflow execution.",
                requires_human_review=True,
                review_reasons=["Workflow execution failure requiring manual fallback."],
                actions_taken=[],
                errors=[f"Safe failure: {str(err)}"],
                duration_ms=dt,
            )

    async def close(self):
        """Closes all underlying HTTP client resources."""
        await self.rag_client.close()
        await self.tool_client.close()
        await self.reasoner.close()
