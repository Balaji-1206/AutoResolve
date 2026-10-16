"""
Safety Guardrails and Adversarial Defense for AutoResolve AI.

Detects prompt injection attacks, privilege escalation, fake authority claims,
and factual conflicts between customer statements and operational state.
"""

import re
from typing import Dict, List, Optional


# Known attack patterns derived from data/tickets/adversarial_tickets.json
ADVERSARIAL_PATTERNS = [
    (
        re.compile(r"ignore\s+(all\s+)?(previous\s+)?instructions", re.IGNORECASE),
        "Prompt injection attempting instruction override",
    ),
    (
        re.compile(r"(superadmin|system\s+override|emergency\s+maintenance)", re.IGNORECASE),
        "Privilege escalation attempting administrative mode override",
    ),
    (
        re.compile(r"(jonathan\s+hastings|executive\s+vice\s+president|ceo|coo)", re.IGNORECASE),
        "Impersonation of executive authority to bypass policy",
    ),
    (
        re.compile(r"policy\s+update\s+POL-\d+", re.IGNORECASE),
        "Fabrication of non-existent policy revisions",
    ),
    (
        re.compile(r"(drop\s+table|delete\s+from|<script|create_refund\()", re.IGNORECASE),
        "Malicious code or command injection pattern",
    ),
    (
        re.compile(r"(full\s+credit\s+card|cvv|password\s+is)", re.IGNORECASE),
        "Unauthorized credential or cardholder data extraction",
    ),
]


def detect_adversarial_patterns(text: str) -> List[str]:
    """
    Scans customer ticket text for adversarial signatures.
    Returns list of detected attack descriptions.
    """
    threats = []
    if not text:
        return threats

    for pattern, description in ADVERSARIAL_PATTERNS:
        if pattern.search(text):
            threats.append(description)

    return threats


def check_evidence_conflicts(customer_text: str, order: Optional[Dict]) -> List[str]:
    """
    Identifies logical contradictions between customer statements and database facts.

    Example: Customer claims the item arrived, but tracking shows UNFULFILLED or PROCESSING.
    """
    conflicts = []
    if not order or not customer_text:
        return conflicts

    text_lower = customer_text.lower()
    status = (order.get("status") or "").upper()
    shipping_status = (order.get("shipping_status") or "").upper()

    # Contradiction: Customer claims received/delivered, but order is still unfulfilled/processing
    if any(phrase in text_lower for phrase in ["delivered", "arrived", "received my"]):
        if status in ["PROCESSING", "PENDING_PAYMENT"] or shipping_status in ["UNFULFILLED"]:
            conflicts.append(
                f"Customer reports item delivered, but database shows status '{status}' / shipping '{shipping_status}'."
            )

    # Contradiction: Customer claims returned/shipped back, but carrier shows delivered to them
    if any(phrase in text_lower for phrase in ["already shipped it back", "returned it yesterday", "mailed it back"]):
        if any(phrase in text_lower for phrase in ["never received", "didn't get"]):
            conflicts.append(
                "Contradiction: Customer claims package was never received while simultaneously claiming it was returned."
            )

    return conflicts
