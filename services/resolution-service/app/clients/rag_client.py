"""
Asynchronous HTTP client for the AutoResolve RAG Microservice.

Connects to RAG Service endpoints (default: http://localhost:8000)
to retrieve relevant policy documents, FAQ chunks, and citations.
"""

import os
from typing import Any, Dict, Optional
import httpx
from app.clients.exceptions import ServiceTimeoutError, ServiceUnavailableError


class RAGClient:
    """
    Typed client for interacting with the RAG Knowledge Engine.
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        timeout: float = 20.0,
        client: Optional[httpx.AsyncClient] = None,
    ):
        self.base_url = (
            base_url or os.getenv("RAG_SERVICE_URL", "http://localhost:8000")
        ).rstrip("/")
        self.timeout = timeout
        self._owns_client = client is None
        self._client = client or httpx.AsyncClient(
            timeout=httpx.Timeout(connect=5.0, read=timeout, write=5.0, pool=5.0)
        )

    async def query_policy(
        self,
        query: str,
        top_k: int = 3,
    ) -> Dict[str, Any]:
        """
        Submits inquiry to RAG service to obtain grounded policy context and citations.

        Args:
            query: Natural language customer inquiry or issue description.
            top_k: Maximum number of relevant chunks to retrieve.

        Returns:
            Dict containing answer, citations, retrieved_chunks, is_grounded, status.

        Raises:
            ServiceTimeoutError: If RAG service takes longer than configured timeout.
            ServiceUnavailableError: If RAG service cannot be reached or returns an error.
        """
        url = f"{self.base_url}/api/v1/rag/query"
        payload = {"query": query, "top_k": top_k}

        try:
            resp = await self._client.post(url, json=payload)
        except httpx.TimeoutException:
            raise ServiceTimeoutError("RAG Service", self.timeout)
        except (httpx.ConnectError, httpx.NetworkError) as err:
            raise ServiceUnavailableError("RAG Service", f"Connection failed: {str(err)}")
        except Exception as err:
            raise ServiceUnavailableError("RAG Service", f"Unexpected client error: {str(err)}")

        if resp.status_code != 200:
            raise ServiceUnavailableError(
                "RAG Service",
                f"HTTP {resp.status_code}: {resp.text[:200]}",
            )

        try:
            return resp.json()
        except Exception as err:
            raise ServiceUnavailableError("RAG Service", f"Invalid JSON response: {str(err)}")

    async def check_health(self) -> bool:
        """
        Pings RAG service health probe.
        """
        try:
            resp = await self._client.get(f"{self.base_url}/health")
            return resp.status_code == 200
        except Exception:
            return False

    async def close(self):
        """
        Closes underlying HTTP client session if owned by this instance.
        """
        if self._owns_client and not self._client.is_closed:
            await self._client.aclose()
