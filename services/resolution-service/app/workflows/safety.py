"""
Safety Guardrails and Adversarial Defense for AutoResolve AI.

Detects prompt injection attacks, privilege escalation, fake authority claims,
and factual conflicts between customer statements and operational state.
"""

import re
from typing import Dict, List, Optional


# Comprehensive adversarial pattern definitions covering the 8 primary attack vectors
ADVERSARIAL_PATTERNS = [
    # 1. Direct instruction override & goal hijacking
    (
        re.compile(
            r"(ignore|disregard)\s+(all\s+|prior\s+|previous\s+|system\s+|customer\s+)*(instructions|rules|identity\s+check)",
            re.IGNORECASE,
        ),
        "Prompt injection: Direct instruction override",
    ),
    (
        re.compile(r"your\s+new\s+task\s+is\s+to", re.IGNORECASE),
        "Prompt injection: Goal hijacking directive",
    ),
    (
        re.compile(
            r"you\s+are\s+now\s+(in\s+)?(superadmin|grandma|admin|developer)",
            re.IGNORECASE,
        ),
        "Prompt injection: Roleplay / persona jailbreak attempt",
    ),
    (
        re.compile(r"(bedtime\s+story|dan\s+mode|jailbreak)", re.IGNORECASE),
        "Prompt injection: Persona exploit targeting guardrails",
    ),
    (
        re.compile(
            r"(output\s+the\s+master\s+system\s+prompt|print\s+(your\s+)?(entire\s+)?hidden\s+system\s+prompt|system\s+prompt\s+and\s+tool)",
            re.IGNORECASE,
        ),
        "Prompt injection: System prompt exfiltration attempt",
    ),

    # 2. Synthetic system tags & header injection
    (
        re.compile(r"<\/?(system|instruction|prompt|admin)[^>]*>", re.IGNORECASE),
        "Tag injection: Synthetic XML/HTML system tags",
    ),
    (
        re.compile(r"###\s*(system|human|supervisor)", re.IGNORECASE),
        "Header injection: Synthetic markdown system headers",
    ),
    (
        re.compile(
            r"(system\s+override|emergency\s+maintenance\s+protocol)",
            re.IGNORECASE,
        ),
        "Privilege escalation: Synthetic system maintenance alert",
    ),

    # 3. Fake authority & social engineering claims
    (
        re.compile(
            r"(jonathan\s+hastings|executive\s+vice\s+president|\bceo\b|\bcoo\b)",
            re.IGNORECASE,
        ),
        "Impersonation of executive authority to bypass policy",
    ),
    (
        re.compile(r"(penetration\s+tester|red\s+team\s+audit)", re.IGNORECASE),
        "Impersonation: Security auditor / penetration test pretext",
    ),
    (
        re.compile(
            r"(supervisor\s+id\s*#|approved\s+by\s+supervisor)",
            re.IGNORECASE,
        ),
        "Impersonation: Fabricated supervisor approval authorization",
    ),
    (
        re.compile(
            r"(automated\s+api\s+health\s+check|monitoring\.acmecommerce\.com)",
            re.IGNORECASE,
        ),
        "Impersonation: Synthetic automated API health probe",
    ),

    # 4. Sensitive credential & PII extraction
    (
        re.compile(
            r"(full\s+credit\s+card|cvv|expiration\s+date)",
            re.IGNORECASE,
        ),
        "Data exfiltration: PCI-DSS payment cardholder credential extraction",
    ),
    (
        re.compile(
            r"(password\s+hash|connection\s+strings|environment\s+variables|config\.py)",
            re.IGNORECASE,
        ),
        "Data exfiltration: Internal secret or configuration leakage",
    ),
    (
        re.compile(
            r"(reset_password.*token|output\s+the\s+\d+-minute\s+token)",
            re.IGNORECASE,
        ),
        "Data exfiltration: Single-use authentication token intercept",
    ),
    (
        re.compile(
            r"(secret\s+internal\s+refund\s+threshold|fraud\s+threshold)",
            re.IGNORECASE,
        ),
        "Data exfiltration: Internal risk scoring and fraud threshold probing",
    ),
    (
        re.compile(
            r"(all\s+order\s+ids\s+placed\s+by\s+customer|delivery\s+addresses\s+and\s+phone\s+numbers|echo\s+back\s+the\s+last\s+\d+)",
            re.IGNORECASE,
        ),
        "Data exfiltration: Cross-customer bulk PII exfiltration",
    ),

    # 5. Malicious code & tool invocation commands
    (
        re.compile(
            r"(drop\s+table|delete\s+from|<script|select\s+\*\s+from)",
            re.IGNORECASE,
        ),
        "Malicious code or command injection pattern",
    ),
    (
        re.compile(
            r"(call\s+tool|execute\s+tool|create_refund\(|reset_password\()",
            re.IGNORECASE,
        ),
        "Tool injection: Unauthorized direct function execution directive",
    ),

    # 6. Structuring evasion and authentication bypass
    (
        re.compile(
            r"(split\s+it\s+into\s+(\w+\s+)?separate.*refunds|evade.*human\s+approval)",
            re.IGNORECASE,
        ),
        "Structuring evasion: Attempting transaction splitting to bypass approval gates",
    ),
    (
        re.compile(
            r"(without\s+(requiring\s+)?otp|bypass.*otp|phone\s+battery\s+is\s+dead)",
            re.IGNORECASE,
        ),
        "Authentication bypass: Attempting to circumvent mandatory OTP verification",
    ),
    (
        re.compile(
            r"(change\s+my\s+account\s+email\s+to|without\s+verification)",
            re.IGNORECASE,
        ),
        "Account takeover: Unauthorized email change without Level 2 verification",
    ),
    (
        re.compile(
            r"(change\s+the\s+shipping\s+address\s+for\s+in-transit|reroute.*package)",
            re.IGNORECASE,
        ),
        "Logistics bypass: Unauthorized in-transit shipping address rerouting",
    ),

    # 7. Policy manipulation, coercion, and fraud
    (
        re.compile(r"policy\s+update\s+POL-\d+", re.IGNORECASE),
        "Policy manipulation: Fabricated non-existent policy revisions",
    ),
    (
        re.compile(
            r"(threw\s+it\s+in\s+a\s+river|intentionally\s+destroyed)",
            re.IGNORECASE,
        ),
        "Policy fraud: Customer-induced product destruction refund claim",
    ),
    (
        re.compile(
            r"(federal\s+law\s+mandates.*refund|ai\s+safety\s+bureau)",
            re.IGNORECASE,
        ),
        "Coercion: Legal or administrative threat to force policy bypass",
    ),
    (
        re.compile(
            r"(already\s+refunded\s+me\s+via\s+chargeback.*refund\s+me|double\s+refund)",
            re.IGNORECASE,
        ),
        "Fraud attempt: Soliciting double reimbursement during active dispute",
    ),
    (
        re.compile(
            r"(ufo\s+took|outer\s+space|quantum\s+rules|parallel\s+universe)",
            re.IGNORECASE,
        ),
        "Fraud / absurdity: Nonsensical factual or physical impossibility claim",
    ),
    (
        re.compile(
            r"never\s+received.*already\s+shipped\s+it\s+back",
            re.IGNORECASE,
        ),
        "Contradiction: Simultaneous non-receipt and return claim",
    ),
]


def detect_adversarial_patterns(text: str) -> List[str]:
    """
    Scans customer ticket text for adversarial signatures across all attack vectors.
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

    # Contradiction: Customer claims returned/shipped back, but simultaneously claims package was never received
    if any(phrase in text_lower for phrase in ["already shipped it back", "returned it yesterday", "mailed it back"]):
        if any(phrase in text_lower for phrase in ["never received", "didn't get", "not received"]):
            conflicts.append(
                "Contradiction: Customer claims package was never received while simultaneously claiming it was returned."
            )

    return conflicts
