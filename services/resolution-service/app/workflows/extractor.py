"""
Identifier Extractor for AutoResolve AI.

Scans natural language ticket text to extract business identifiers (orders, customers,
payments, refunds, tickets) using canonical AcmeCommerce regex patterns.
"""

import re
from typing import Dict, Optional
from app.models.resolution import InvestigationRequest

# Canonical identifier patterns
PATTERNS = {
    "order_id": re.compile(r"\bORD-\d+\b", re.IGNORECASE),
    "customer_id": re.compile(r"\bCUS-\d+\b", re.IGNORECASE),
    "payment_id": re.compile(r"\bPAY-\d+\b", re.IGNORECASE),
    "refund_id": re.compile(r"\bREF-\d+\b", re.IGNORECASE),
    "ticket_id": re.compile(r"\b(TCK|ADV)-\d+\b", re.IGNORECASE),
}


def extract_identifiers(text: str) -> Dict[str, Optional[str]]:
    """
    Extracts the first matching instance of each canonical identifier from text.
    Returns normalized uppercase identifiers.
    """
    results: Dict[str, Optional[str]] = {
        "order_id": None,
        "customer_id": None,
        "payment_id": None,
        "refund_id": None,
        "ticket_id": None,
    }

    if not text:
        return results

    for key, pattern in PATTERNS.items():
        match = pattern.search(text)
        if match:
            results[key] = match.group(0).upper()

    return results


def resolve_request_identifiers(request: InvestigationRequest) -> Dict[str, Optional[str]]:
    """
    Combines pre-structured request identifiers with entities extracted from the ticket text.
    Explicit request fields take precedence over extracted matches.
    """
    extracted = extract_identifiers(request.ticket_text)

    return {
        "order_id": request.order_id or extracted["order_id"],
        "customer_id": request.customer_id or extracted["customer_id"],
        "payment_id": request.payment_id or extracted["payment_id"],
        "refund_id": request.refund_id or extracted["refund_id"],
        "ticket_id": request.ticket_id or extracted["ticket_id"],
    }
