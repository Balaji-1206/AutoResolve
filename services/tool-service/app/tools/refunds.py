"""
Refund Investigation Tool Implementation.

Provides fast, in-memory indexed lookup for refund claims and status from operational datasets.
"""

from datetime import datetime
import json
import os
from pathlib import Path
import re
import sqlite3
from typing import Dict, Optional
from app.database import get_db_connection
from app.models.tool import RefundResponse


class RefundNotFoundError(Exception):
    """Raised when the requested refund ID does not exist in operational data."""
    pass


_REFUNDS_CACHE: Optional[Dict[str, RefundResponse]] = None


def _row_to_refund(row: sqlite3.Row) -> RefundResponse:
    """Maps a SQLite refund row to the typed RefundResponse model."""
    return RefundResponse(
        refund_id=row["refund_id"],
        order_id=row["order_id"],
        customer_id=row["customer_id"],
        amount=float(row["amount"]),
        status=row["status"],
        reason=row["reason"] or "General return",
        requested_at=row["requested_at"],
        approved_at=row["approved_at"],
        processed_at=row["processed_at"],
    )


def _find_refunds_file() -> Path:
    """
    Locates the refunds.json dataset across standard relative and environment paths.
    """
    env_path = os.getenv("REFUNDS_DATA_PATH")
    if env_path and Path(env_path).is_file():
        return Path(env_path)

    current_dir = Path(__file__).resolve().parent
    candidates = [
        current_dir.parent.parent / "data" / "refunds.json",
        current_dir.parent.parent / "data" / "refunds" / "refunds.json",
        current_dir.parent.parent.parent.parent / "data" / "refunds" / "refunds.json",
    ]

    for candidate in candidates:
        if candidate.is_file():
            return candidate

    raise FileNotFoundError(
        f"Unable to locate refunds.json dataset. Checked candidates: {[str(c) for c in candidates]}"
    )


def _load_refunds_index() -> Dict[str, RefundResponse]:
    """
    Loads and parses refunds.json into an in-memory dictionary keyed by refund_id.
    """
    global _REFUNDS_CACHE
    if _REFUNDS_CACHE is not None:
        return _REFUNDS_CACHE

    refunds_path = _find_refunds_file()
    with open(refunds_path, "r", encoding="utf-8") as file:
        raw_refunds = json.load(file)

    index: Dict[str, RefundResponse] = {}
    for item in raw_refunds:
        refund_id = item.get("refund_id", "").strip().upper()
        if not refund_id:
            continue

        refund = RefundResponse(
            refund_id=refund_id,
            order_id=item.get("order_id", ""),
            customer_id=item.get("customer_id", ""),
            amount=float(item.get("amount", 0.0)),
            status=item.get("status", "UNKNOWN"),
            reason=item.get("reason", "UNKNOWN"),
            requested_at=item.get("requested_at", ""),
            approved_at=item.get("approved_at"),
            processed_at=item.get("processed_at"),
        )
        index[refund_id] = refund

    _REFUNDS_CACHE = index
    return _REFUNDS_CACHE


def get_refund(refund_id: str) -> RefundResponse:
    """
    Retrieve structured refund record details by refund ID.

    Args:
        refund_id: The refund identifier (e.g. 'REF-1001')

    Returns:
        RefundResponse: Standardized refund record

    Raises:
        ValueError: If refund_id format is invalid
        RefundNotFoundError: If refund does not exist in operational data
    """
    if not refund_id or not isinstance(refund_id, str):
        raise ValueError("Invalid refund ID: ID must be a non-empty string.")

    clean_id = refund_id.strip().upper()

    if not re.match(r"^REF-[A-Z0-9\-]+$", clean_id):
        raise ValueError(f"Invalid refund ID format: '{refund_id}'. Expected format: 'REF-XXXX'")

    # Check SQLite database first
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM refunds WHERE refund_id = ?;", (clean_id,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return _row_to_refund(row)
    except Exception:
        pass

    index = _load_refunds_index()
    if clean_id not in index:
        raise RefundNotFoundError(f"Refund '{clean_id}' not found in operational database.")

    return index[clean_id]


def create_or_update_refund(
    refund_id: str,
    order_id: str,
    customer_id: str,
    amount: float,
    status: str = "PENDING",
    reason: str = "Customer request",
    approved_at: Optional[str] = None,
    processed_at: Optional[str] = None,
) -> RefundResponse:
    """
    Persists or updates a refund claim into SQLite and returns the typed record.
    """
    clean_id = refund_id.strip().upper()
    now_iso = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    conn = get_db_connection()
    with conn:
        conn.execute("""
            INSERT OR REPLACE INTO refunds (
                refund_id, order_id, customer_id, amount, status, reason, requested_at, approved_at, processed_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (clean_id, order_id, customer_id, amount, status, reason, now_iso, approved_at, processed_at))
    conn.close()

    return RefundResponse(
        refund_id=clean_id,
        order_id=order_id,
        customer_id=customer_id,
        amount=amount,
        status=status,
        reason=reason,
        requested_at=now_iso,
        approved_at=approved_at,
        processed_at=processed_at,
    )
