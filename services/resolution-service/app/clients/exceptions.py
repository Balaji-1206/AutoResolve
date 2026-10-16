"""
Typed domain exceptions for inter-service communication.
"""


class MicroserviceError(Exception):
    """Base exception for all microservice communication failures."""
    def __init__(self, service_name: str, message: str, status_code: int = 500):
        super().__init__(f"[{service_name}] {message}")
        self.service_name = service_name
        self.message = message
        self.status_code = status_code


class ServiceUnavailableError(MicroserviceError):
    """Raised when an upstream microservice cannot be reached or returns 5xx."""
    def __init__(self, service_name: str, message: str = "Service unavailable"):
        super().__init__(service_name, message, status_code=503)


class ServiceTimeoutError(MicroserviceError):
    """Raised when an upstream microservice fails to respond within the deadline."""
    def __init__(self, service_name: str, timeout_seconds: float):
        super().__init__(
            service_name,
            f"Request timed out after {timeout_seconds}s",
            status_code=504,
        )


class EntityNotFoundError(MicroserviceError):
    """Raised when an entity is explicitly confirmed missing (HTTP 404)."""
    def __init__(self, service_name: str, entity_type: str, entity_id: str):
        super().__init__(
            service_name,
            f"{entity_type} '{entity_id}' not found",
            status_code=404,
        )
        self.entity_type = entity_type
        self.entity_id = entity_id
