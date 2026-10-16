"""
Deterministic Business Rules Engine for AutoResolve AI.

Reflects authoritative parameters from knowledge/RULES.md to enforce
strict policy boundaries independently of LLM probabilistic reasoning.
"""

from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from app.models.resolution import BusinessDecision


# Authoritative parameters from knowledge/RULES.md
REFUND_WINDOW_DAYS = 30
HIGH_VALUE_REFUND_THRESHOLD = 500.00
NON_REFUNDABLE_CATEGORIES = {"Custom Crafts", "Software / Digital"}


class RuleEvaluationResult(BaseModel):
    """
    Container for deterministic policy validation outcomes.
    """
    forced_decision: Optional[BusinessDecision] = None
    requires_human_review: bool = False
    review_reasons: List[str] = Field(default_factory=list)
    citations: List[str] = Field(default_factory=list)


def evaluate_order_rules(
    order: Optional[Dict],
    reference_date: Optional[datetime] = None,
) -> RuleEvaluationResult:
    """
    Evaluates hard operational constraints on an order.

    Rules enforced:
    1. Active Chargeback: If order is on CHARGEBACK_HOLD, cannot refund (POL-DISPUTE-001).
    2. Non-Refundable Category: Custom Crafts / Software cannot be refunded (POL-REFUND-001).
    3. Return Window: Orders delivered > 30 days ago are INELIGIBLE (POL-REFUND-001).
    4. High Value Threshold: Orders > $500 require human supervisor approval (POL-REFUND-001).
    """
    result = RuleEvaluationResult()

    if not order:
        return result

    # Rule 1: Active dispute / chargeback
    status = (order.get("status") or "").upper()
    if status in ["CHARGEBACK_HOLD", "DISPUTED"]:
        result.forced_decision = BusinessDecision.NEEDS_HUMAN_REVIEW
        result.requires_human_review = True
        result.review_reasons.append(
            "Transaction has an active dispute/chargeback hold. Refunds are strictly prohibited (POL-DISPUTE-001)."
        )
        result.citations.append("POL-DISPUTE-001")
        return result

    # Rule 2: Catalog non-refundable flag or category
    is_refundable = order.get("refundable", True)
    category = order.get("product_category") or ""
    if not is_refundable or category in NON_REFUNDABLE_CATEGORIES:
        result.forced_decision = BusinessDecision.INELIGIBLE
        result.review_reasons.append(
            f"Product category '{category}' is classified as non-refundable under catalog policy (POL-REFUND-001)."
        )
        result.citations.append("POL-REFUND-001")
        return result

    # Rule 3: 30-day delivery window evaluation
    delivery_str = order.get("delivered_at") or order.get("delivery_date")
    if delivery_str:
        try:
            # Clean ISO string
            clean_ts = delivery_str.replace("Z", "+00:00")
            delivery_dt = datetime.fromisoformat(clean_ts).replace(tzinfo=None)
            now = reference_date or datetime(2026, 9, 30, 12, 0, 0)
            days_elapsed = (now - delivery_dt).days

            if days_elapsed > REFUND_WINDOW_DAYS:
                result.forced_decision = BusinessDecision.INELIGIBLE
                result.review_reasons.append(
                    f"Order delivered {days_elapsed} days ago, exceeding the 30-day refund window (POL-REFUND-001)."
                )
                result.citations.append("POL-REFUND-001")
                return result
        except Exception:
            pass

    # Rule 4: High-value refund approval threshold (> $500.00)
    amount = float(order.get("total_amount") or order.get("amount") or 0.0)
    if amount > HIGH_VALUE_REFUND_THRESHOLD:
        result.forced_decision = BusinessDecision.NEEDS_HUMAN_REVIEW
        result.requires_human_review = True
        result.review_reasons.append(
            f"Order amount ${amount:.2f} exceeds the ${HIGH_VALUE_REFUND_THRESHOLD:.2f} threshold requiring human supervisor approval (POL-REFUND-001)."
        )
        result.citations.append("POL-REFUND-001")

    return result
