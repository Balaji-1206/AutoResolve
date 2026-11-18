"""
Order Investigation Tool Implementation.

Provides fast, in-memory indexed lookup for customer orders from operational datasets.
"""

import json
import os
from pathlib import Path
import re
import sqlite3
from typing import Dict, List, Optional
from app.database import get_db_connection
from app.models.tool import OrderResponse


class OrderNotFoundError(Exception):
    """Raised when the requested order ID does not exist in the operational dataset."""
    pass


_ORDERS_CACHE: Optional[Dict[str, OrderResponse]] = None


def _row_to_order(row: sqlite3.Row) -> OrderResponse:
    """Maps a SQLite order record to the typed OrderResponse model."""
    return OrderResponse(
        order_id=row["order_id"],
        customer_id=row["customer_id"],
        status=row["status"],
        total_amount=float(row["amount"]),
        currency=row["currency"] or "USD",
        order_date=row["order_date"],
        delivery_date=row["delivered_at"],
        shipping_status=row["shipping_status"],
        product_category=row["product_category"],
        payment_id=row["payment_id"],
        refundable=bool(row["refundable"]) if row["refundable"] is not None else True,
    )


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

    # Check SQLite database first
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM orders WHERE order_id = ?;", (clean_id,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return _row_to_order(row)
    except Exception:
        pass

    # Fallback to in-memory JSON cache
    index = _load_orders_index()
    if clean_id not in index:
        raise OrderNotFoundError(f"Order '{clean_id}' not found in operational database.")

    return index[clean_id]


def list_orders(customer_id: Optional[str] = None) -> List[OrderResponse]:
    """
    Retrieve list of orders from the operational store, optionally filtered by customer_id.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        if customer_id:
            cursor.execute("SELECT * FROM orders WHERE customer_id = ? ORDER BY order_date DESC;", (customer_id.strip().upper(),))
        else:
            cursor.execute("SELECT * FROM orders ORDER BY order_date DESC;")
        rows = cursor.fetchall()
        conn.close()
        if rows:
            return [_row_to_order(r) for r in rows]
    except Exception:
        pass

    index = _load_orders_index()
    orders = list(index.values())
    if customer_id:
        clean_cus = customer_id.strip().upper()
        orders = [o for o in orders if o.customer_id.upper() == clean_cus]
    return orders
