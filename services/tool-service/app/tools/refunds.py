"""
Refund Investigation Tool Implementation.

Provides fast, in-memory indexed lookup for refund claims and status from operational datasets.
"""

import json
import os
from pathlib import Path
import re
from typing import Dict, Optional
from app.models.tool import RefundResponse


class RefundNotFoundError(Exception):
    """Raised when the requested refund ID does not exist in operational data."""
    pass


_REFUNDS_CACHE: Optional[Dict[str, RefundResponse]] = None


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

    if not re.match(r"^REF-\d+$", clean_id):
        raise ValueError(f"Invalid refund ID format: '{refund_id}'. Expected format: 'REF-XXXX'")

    index = _load_refunds_index()
    if clean_id not in index:
        raise RefundNotFoundError(f"Refund '{clean_id}' not found in operational database.")

    return index[clean_id]
