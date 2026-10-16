"""
Evidence Collection Orchestrator for AutoResolve AI.

Gathers policy evidence from the RAG Service and operational facts from the Tool Service,
following data relationships (Order -> Customer, Order -> Payment) and tracking missing information.
"""

import asyncio
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.clients.exceptions import MicroserviceError
from app.clients.rag_client import RAGClient
from app.clients.tool_client import ToolClient
from app.models.resolution import (
    InvestigationRequest,
    OperationalEvidence,
    PolicyEvidenceItem,
)
from app.workflows.extractor import resolve_request_identifiers


class CollectedEvidence(BaseModel):
    """
    Structured container holding gathered policy and operational evidence.
    """
    ticket_id: Optional[str] = None
    policy_evidence: List[PolicyEvidenceItem] = Field(default_factory=list)
    operational_evidence: OperationalEvidence = Field(default_factory=OperationalEvidence)
    missing_information: List[str] = Field(default_factory=list)
    errors: List[str] = Field(default_factory=list)
    raw_rag_response: Optional[Dict[str, Any]] = None


class EvidenceCollector:
    """
    Coordinates multi-source evidence gathering across RAG and Tool microservices.
    """

    def __init__(self, rag_client: RAGClient, tool_client: ToolClient):
        self.rag_client = rag_client
        self.tool_client = tool_client

    async def collect_evidence(self, request: InvestigationRequest) -> CollectedEvidence:
        """
        Executes the evidence collection pipeline for a ticket.

        1. Extracts and resolves all candidate identifiers (Order, Customer, Payment, Refund).
        2. Dispatches parallel requests to RAG and primary Tool endpoints.
        3. Traverses entity relationships (e.g. extracts payment_id & customer_id from Order).
        4. Compiles citations, records tools called, and documents missing information.
        """
        ids = resolve_request_identifiers(request)
        ticket_id = ids["ticket_id"]

        policy_evidence: List[PolicyEvidenceItem] = []
        operational_evidence = OperationalEvidence()
        missing_information: List[str] = []
        errors: List[str] = []
        raw_rag: Optional[Dict[str, Any]] = None

        # ----------------------------------------------------------------------
        # Phase 1: Parallel dispatch (RAG Query + Known Primary Lookups)
        # ----------------------------------------------------------------------
        rag_task = asyncio.create_task(self._fetch_rag_policy(request.ticket_text))

        order_task = (
            asyncio.create_task(self.tool_client.get_order(ids["order_id"]))
            if ids["order_id"]
            else None
        )
        customer_task = (
            asyncio.create_task(self.tool_client.get_customer(ids["customer_id"]))
            if ids["customer_id"]
            else None
        )
        payment_task = (
            asyncio.create_task(self.tool_client.get_payment(ids["payment_id"]))
            if ids["payment_id"]
            else None
        )
        refund_task = (
            asyncio.create_task(self.tool_client.get_refund(ids["refund_id"]))
            if ids["refund_id"]
            else None
        )

        # Await RAG
        rag_result, rag_error = await rag_task
        if rag_error:
            errors.append(rag_error)
        elif rag_result:
            raw_rag = rag_result
            policy_evidence = self._parse_policy_evidence(rag_result)

        # Await Initial Tools
        order_record = await order_task if order_task else None
        customer_record = await customer_task if customer_task else None
        payment_record = await payment_task if payment_task else None
        refund_record = await refund_task if refund_task else None

        # ----------------------------------------------------------------------
        # Phase 2: Process Order Evidence & Traverse Relational Links
        # ----------------------------------------------------------------------
        if ids["order_id"]:
            operational_evidence.tools_called.append("get_order")
            if order_record:
                operational_evidence.order = order_record

                # Relational traversal: Discover customer_id if not previously known
                if not customer_record and order_record.get("customer_id"):
                    cid = order_record["customer_id"]
                    customer_record = await self.tool_client.get_customer(cid)
                    operational_evidence.tools_called.append("get_customer")

                # Relational traversal: Discover payment_id if not previously known
                if not payment_record and order_record.get("payment_id"):
                    pid = order_record["payment_id"]
                    payment_record = await self.tool_client.get_payment(pid)
                    operational_evidence.tools_called.append("get_payment")
            else:
                missing_information.append(
                    f"Order '{ids['order_id']}' not found in operational records."
                )
        else:
            missing_information.append("Order identifier (ORD-XXXX) not specified in ticket.")

        # ----------------------------------------------------------------------
        # Phase 3: Process Customer, Payment, and Refund Records
        # ----------------------------------------------------------------------
        if customer_record:
            operational_evidence.customer = customer_record
            if "get_customer" not in operational_evidence.tools_called:
                operational_evidence.tools_called.append("get_customer")
        elif ids["customer_id"]:
            operational_evidence.tools_called.append("get_customer")
            missing_information.append(
                f"Customer '{ids['customer_id']}' not found in operational records."
            )

        if payment_record:
            operational_evidence.payment = payment_record
            if "get_payment" not in operational_evidence.tools_called:
                operational_evidence.tools_called.append("get_payment")
        elif ids["payment_id"]:
            operational_evidence.tools_called.append("get_payment")
            missing_information.append(
                f"Payment '{ids['payment_id']}' not found in operational records."
            )

        if refund_record:
            operational_evidence.refund = refund_record
            if "get_refund" not in operational_evidence.tools_called:
                operational_evidence.tools_called.append("get_refund")
        elif ids["refund_id"]:
            operational_evidence.tools_called.append("get_refund")
            missing_information.append(
                f"Refund '{ids['refund_id']}' not found in operational records."
            )

        return CollectedEvidence(
            ticket_id=ticket_id,
            policy_evidence=policy_evidence,
            operational_evidence=operational_evidence,
            missing_information=missing_information,
            errors=errors,
            raw_rag_response=raw_rag,
        )

    async def _fetch_rag_policy(self, query: str) -> tuple[Optional[Dict[str, Any]], Optional[str]]:
        """Safely queries RAG service, catching communication errors."""
        try:
            res = await self.rag_client.query_policy(query=query, top_k=3)
            return res, None
        except MicroserviceError as err:
            return None, f"Policy retrieval degraded: {str(err)}"
        except Exception as err:
            return None, f"Unexpected RAG client error: {str(err)}"

    @staticmethod
    def _parse_policy_evidence(rag_result: Dict[str, Any]) -> List[PolicyEvidenceItem]:
        """Translates RAG response citations and chunks into PolicyEvidenceItem models."""
        items: List[PolicyEvidenceItem] = []
        citations = rag_result.get("citations", [])
        retrieved_chunks = {c.get("document_id"): c for c in rag_result.get("retrieved_chunks", [])}

        for cit in citations:
            doc_id = cit.get("document_id", "DOC-UNKNOWN")
            matching_chunk = retrieved_chunks.get(doc_id, {})
            snippet = matching_chunk.get("snippet", cit.get("section", ""))

            items.append(
                PolicyEvidenceItem(
                    document_id=doc_id,
                    domain=cit.get("domain", "general"),
                    authority=cit.get("authority", "authoritative"),
                    section=cit.get("section", "General"),
                    source=cit.get("source", ""),
                    score=float(cit.get("score", 0.0)),
                    snippet=snippet,
                )
            )

        return items
