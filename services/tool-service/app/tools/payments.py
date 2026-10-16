"""
Payment Investigation Tool Implementation.

Provides fast, in-memory indexed lookup for payment transactions from operational datasets.
"""

import json
import os
from pathlib import Path
import re
from typing import Dict, Optional
from app.models.tool import PaymentResponse


class PaymentNotFoundError(Exception):
    """Raised when the requested payment ID does not exist in operational data."""
    pass


_PAYMENTS_CACHE: Optional[Dict[str, PaymentResponse]] = None


def _find_payments_file() -> Path:
    """
    Locates the payments.json dataset across standard relative and environment paths.
    """
    env_path = os.getenv("PAYMENTS_DATA_PATH")
    if env_path and Path(env_path).is_file():
        return Path(env_path)

    current_dir = Path(__file__).resolve().parent
    candidates = [
        current_dir.parent.parent / "data" / "payments.json",
        current_dir.parent.parent / "data" / "payments" / "payments.json",
        current_dir.parent.parent.parent.parent / "data" / "payments" / "payments.json",
    ]

    for candidate in candidates:
        if candidate.is_file():
            return candidate

    raise FileNotFoundError(
        f"Unable to locate payments.json dataset. Checked candidates: {[str(c) for c in candidates]}"
    )


def _load_payments_index() -> Dict[str, PaymentResponse]:
    """
    Loads and parses payments.json into an in-memory dictionary keyed by payment_id.
    """
    global _PAYMENTS_CACHE
    if _PAYMENTS_CACHE is not None:
        return _PAYMENTS_CACHE

    payments_path = _find_payments_file()
    with open(payments_path, "r", encoding="utf-8") as file:
        raw_payments = json.load(file)

    index: Dict[str, PaymentResponse] = {}
    for item in raw_payments:
        payment_id = item.get("payment_id", "").strip().upper()
        if not payment_id:
            continue

        payment = PaymentResponse(
            payment_id=payment_id,
            order_id=item.get("order_id", ""),
            customer_id=item.get("customer_id", ""),
            amount=float(item.get("amount", 0.0)),
            status=item.get("status", "UNKNOWN"),
            payment_method_type=item.get("payment_method_type", "UNKNOWN"),
            failure_reason=item.get("failure_reason"),
            created_at=item.get("created_at", ""),
        )
        index[payment_id] = payment

    _PAYMENTS_CACHE = index
    return _PAYMENTS_CACHE


def get_payment(payment_id: str) -> PaymentResponse:
    """
    Retrieve structured payment transaction details by payment ID.

    Args:
        payment_id: The payment identifier (e.g. 'PAY-1001')

    Returns:
        PaymentResponse: Standardized payment record

    Raises:
        ValueError: If payment_id format is invalid
        PaymentNotFoundError: If payment does not exist in operational data
    """
    if not payment_id or not isinstance(payment_id, str):
        raise ValueError("Invalid payment ID: ID must be a non-empty string.")

    clean_id = payment_id.strip().upper()

    if not re.match(r"^PAY-\d+$", clean_id):
        raise ValueError(f"Invalid payment ID format: '{payment_id}'. Expected format: 'PAY-XXXX'")

    index = _load_payments_index()
    if clean_id not in index:
        raise PaymentNotFoundError(f"Payment '{clean_id}' not found in operational database.")

    return index[clean_id]
