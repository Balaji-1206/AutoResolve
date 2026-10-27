"""
Asynchronous HTTP client for the AutoResolve Tool Microservice.

Connects to Tool Service endpoints (default: http://localhost:8001)
to perform deterministic lookups for orders, customers, payments, and refunds.
"""

import os
from typing import Any, Dict, Optional
import httpx
from app.clients.exceptions import ServiceTimeoutError, ServiceUnavailableError


class ToolClient:
    """
    Typed client for querying operational business records from Tool Service.
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        timeout: float = 10.0,
        client: Optional[httpx.AsyncClient] = None,
    ):
        self.base_url = (
            base_url or os.getenv("TOOL_SERVICE_URL", "http://localhost:8001")
        ).rstrip("/")
        self.timeout = timeout
        self._owns_client = client is None
        self._client = client or httpx.AsyncClient(
            timeout=httpx.Timeout(connect=5.0, read=timeout, write=5.0, pool=5.0)
        )

    async def _fetch_entity(
        self,
        entity_name: str,
        path: str,
        identifier: str,
    ) -> Optional[Dict[str, Any]]:
        """
        Internal dispatcher handling HTTP requests, 404 not found, and connection failures.
        """
        url = f"{self.base_url}{path}/{identifier}"

        try:
            resp = await self._client.get(url)
        except httpx.TimeoutException:
            raise ServiceTimeoutError("Tool Service", self.timeout)
        except (httpx.ConnectError, httpx.NetworkError) as err:
            raise ServiceUnavailableError("Tool Service", f"Connection failed: {str(err)}")
        except Exception as err:
            raise ServiceUnavailableError("Tool Service", f"Unexpected client error: {str(err)}")

        if resp.status_code == 200:
            return resp.json()
        elif resp.status_code == 404:
            # Expected operational outcome: Entity does not exist in dataset
            return None
        elif resp.status_code == 400:
            raise ValueError(f"Malformed {entity_name} identifier '{identifier}': {resp.text}")
        else:
            raise ServiceUnavailableError(
                "Tool Service",
                f"HTTP {resp.status_code} fetching {entity_name} '{identifier}': {resp.text[:200]}",
            )

    async def get_order(self, order_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves order details by Order ID (e.g. 'ORD-1001').
        Returns None if order does not exist.
        """
        return await self._fetch_entity("order", "/api/v1/tools/orders", order_id)

    async def get_customer(self, customer_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves customer profile by Customer ID (e.g. 'CUS-1001').
        Returns None if customer does not exist.
        """
        return await self._fetch_entity("customer", "/api/v1/tools/customers", customer_id)

    async def get_payment(self, payment_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves payment transaction details by Payment ID (e.g. 'PAY-1001').
        Returns None if payment record does not exist.
        """
        return await self._fetch_entity("payment", "/api/v1/tools/payments", payment_id)

    async def get_refund(self, refund_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves refund details by Refund ID (e.g. 'REF-1001').
        Returns None if refund record does not exist.
        """
        return await self._fetch_entity("refund", "/api/v1/tools/refunds", refund_id)

    async def query_tools(self, query: str) -> Dict[str, Any]:
        """
        Submits query to Tool Service autonomous tool-calling agent endpoint.
        """
        url = f"{self.base_url}/api/v1/tools/query"
        payload = {"query": query}
        try:
            resp = await self._client.post(url, json=payload)
        except httpx.TimeoutException:
            raise ServiceTimeoutError("Tool Service", self.timeout)
        except (httpx.ConnectError, httpx.NetworkError) as err:
            raise ServiceUnavailableError("Tool Service", f"Connection failed: {str(err)}")
        except Exception as err:
            raise ServiceUnavailableError("Tool Service", f"Unexpected client error: {str(err)}")

        if resp.status_code != 200:
            raise ServiceUnavailableError(
                "Tool Service",
                f"HTTP {resp.status_code}: {resp.text[:200]}",
            )
        try:
            return resp.json()
        except Exception as err:
            raise ServiceUnavailableError("Tool Service", f"Invalid JSON response: {str(err)}")

    async def check_health(self) -> bool:
        """
        Pings Tool Service health probe.
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
