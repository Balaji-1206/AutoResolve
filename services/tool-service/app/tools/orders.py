"""
Order Investigation Tool Implementation.

Provides fast, in-memory indexed lookup for customer orders from operational datasets.
"""

import json
import os
from pathlib import Path
import re
from typing import Dict, Optional
from app.models.tool import OrderResponse


class OrderNotFoundError(Exception):
    """Raised when the requested order ID does not exist in the operational dataset."""
    pass


_ORDERS_CACHE: Optional[Dict[str, OrderResponse]] = None


def _find_orders_file() -> Path:
    """
    Locates the orders.json dataset file across standard relative and environment locations.
    """
    env_path = os.getenv("ORDERS_DATA_PATH")
    if env_path and Path(env_path).is_file():
        return Path(env_path)

    current_dir = Path(__file__).resolve().parent
    candidates = [
        current_dir.parent.parent / "data" / "orders.json",
        current_dir.parent.parent / "data" / "orders" / "orders.json",
        current_dir.parent.parent.parent.parent / "data" / "orders" / "orders.json",
    ]

    for candidate in candidates:
        if candidate.is_file():
            return candidate

    raise FileNotFoundError(
        f"Unable to locate orders.json dataset. Checked candidates: {[str(c) for c in candidates]}"
    )


def _load_orders_index() -> Dict[str, OrderResponse]:
    """
    Loads and parses orders.json into an in-memory dictionary keyed by normalized order_id.
    """
    global _ORDERS_CACHE
    if _ORDERS_CACHE is not None:
        return _ORDERS_CACHE

    orders_path = _find_orders_file()
    with open(orders_path, "r", encoding="utf-8") as file:
        raw_orders = json.load(file)

    index: Dict[str, OrderResponse] = {}
    for item in raw_orders:
        order_id = item.get("order_id", "").strip().upper()
        if not order_id:
            continue

        # Map dataset fields to OrderResponse
        order = OrderResponse(
            order_id=order_id,
            customer_id=item.get("customer_id", ""),
            status=item.get("status", "UNKNOWN"),
            total_amount=float(item.get("amount", item.get("total_amount", 0.0))),
            currency=item.get("currency", "USD"),
            order_date=item.get("order_date", ""),
            delivery_date=item.get("delivered_at") or item.get("delivery_date"),
            shipping_status=item.get("shipping_status"),
            product_category=item.get("product_category"),
            payment_id=item.get("payment_id"),
            refundable=item.get("refundable"),
        )
        index[order_id] = order

    _ORDERS_CACHE = index
    return _ORDERS_CACHE


def get_order(order_id: str) -> OrderResponse:
    """
    Retrieve structured order information by order ID.

    Args:
        order_id: The order identifier (e.g., 'ORD-1001')

    Returns:
        OrderResponse: Validated order record with standardized schema

    Raises:
        ValueError: If order_id format is invalid
        OrderNotFoundError: If order does not exist in operational data
    """
    if not order_id or not isinstance(order_id, str):
        raise ValueError("Invalid order ID: ID must be a non-empty string.")

    clean_id = order_id.strip().upper()

    # Validate identifier pattern: ORD- followed by digits
    if not re.match(r"^ORD-\d+$", clean_id):
        raise ValueError(f"Invalid order ID format: '{order_id}'. Expected format: 'ORD-XXXX'")

    index = _load_orders_index()
    if clean_id not in index:
        raise OrderNotFoundError(f"Order '{clean_id}' not found in operational database.")

    return index[clean_id]
