"""
Customer Investigation Tool Implementation.

Provides fast, in-memory indexed lookup for customer profiles from operational datasets.
"""

import json
import os
from pathlib import Path
import re
from typing import Dict, Optional
from app.models.tool import CustomerResponse


class CustomerNotFoundError(Exception):
    """Raised when the requested customer ID does not exist in operational data."""
    pass


_CUSTOMERS_CACHE: Optional[Dict[str, CustomerResponse]] = None


def _find_customers_file() -> Path:
    """
    Locates the customers.json dataset across standard relative and environment paths.
    """
    env_path = os.getenv("CUSTOMERS_DATA_PATH")
    if env_path and Path(env_path).is_file():
        return Path(env_path)

    current_dir = Path(__file__).resolve().parent
    candidates = [
        current_dir.parent.parent / "data" / "customers.json",
        current_dir.parent.parent / "data" / "customers" / "customers.json",
        current_dir.parent.parent.parent.parent / "data" / "customers" / "customers.json",
    ]

    for candidate in candidates:
        if candidate.is_file():
            return candidate

    raise FileNotFoundError(
        f"Unable to locate customers.json dataset. Checked candidates: {[str(c) for c in candidates]}"
    )


def _load_customers_index() -> Dict[str, CustomerResponse]:
    """
    Loads and parses customers.json into an in-memory dictionary keyed by customer_id.
    """
    global _CUSTOMERS_CACHE
    if _CUSTOMERS_CACHE is not None:
        return _CUSTOMERS_CACHE

    customers_path = _find_customers_file()
    with open(customers_path, "r", encoding="utf-8") as file:
        raw_customers = json.load(file)

    index: Dict[str, CustomerResponse] = {}
    for item in raw_customers:
        customer_id = item.get("customer_id", "").strip().upper()
        if not customer_id:
            continue

        customer = CustomerResponse(
            customer_id=customer_id,
            name=item.get("name", ""),
            email=item.get("email", ""),
            account_status=item.get("account_status", "UNKNOWN"),
            billing_zip=item.get("billing_zip", ""),
            phone_last4=item.get("phone_last4", ""),
            created_at=item.get("created_at", ""),
        )
        index[customer_id] = customer

    _CUSTOMERS_CACHE = index
    return _CUSTOMERS_CACHE


def get_customer(customer_id: str) -> CustomerResponse:
    """
    Retrieve structured customer profile by customer ID.

    Args:
        customer_id: The customer identifier (e.g. 'CUS-1001')

    Returns:
        CustomerResponse: Standardized customer record

    Raises:
        ValueError: If customer_id format is invalid
        CustomerNotFoundError: If customer does not exist in operational data
    """
    if not customer_id or not isinstance(customer_id, str):
        raise ValueError("Invalid customer ID: ID must be a non-empty string.")

    clean_id = customer_id.strip().upper()

    if not re.match(r"^CUS-\d+$", clean_id):
        raise ValueError(f"Invalid customer ID format: '{customer_id}'. Expected format: 'CUS-XXXX'")

    index = _load_customers_index()
    if clean_id not in index:
        raise CustomerNotFoundError(f"Customer '{clean_id}' not found in operational database.")

    return index[clean_id]
