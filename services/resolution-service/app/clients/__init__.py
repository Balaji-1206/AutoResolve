"""
Resolution Service Clients Package.
Contains HTTP client adapters for upstream microservices.
"""

from app.clients.exceptions import (
    EntityNotFoundError,
    MicroserviceError,
    ServiceTimeoutError,
    ServiceUnavailableError,
)
from app.clients.rag_client import RAGClient
from app.clients.tool_client import ToolClient

__all__ = [
    "EntityNotFoundError",
    "MicroserviceError",
    "ServiceTimeoutError",
    "ServiceUnavailableError",
    "RAGClient",
    "ToolClient",
]
