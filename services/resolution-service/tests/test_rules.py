"""
Unit tests for the deterministic business rules engine.
"""

from datetime import datetime
from app.models.resolution import BusinessDecision
from app.workflows.rules import evaluate_order_rules

REF_DATE = datetime(2026, 9, 30, 12, 0, 0)


def test_standard_eligible_order():
    """ORD-1001: Delivered 14 days ago, amount $120.00. No rule violations."""
    order = {
        "order_id": "ORD-1001",
        "status": "DELIVERED",
        "total_amount": 120.0,
        "delivered_at": "2026-09-16T12:00:00Z",
        "product_category": "Apparel",
        "refundable": True,
    }
    result = evaluate_order_rules(order, reference_date=REF_DATE)
    assert result.forced_decision is None
    assert result.requires_human_review is False
    assert len(result.review_reasons) == 0


def test_high_value_order_requires_human_review():
    """ORD-1002: Amount $750.00 exceeds $500.00 threshold."""
    order = {
        "order_id": "ORD-1002",
        "status": "DELIVERED",
        "total_amount": 750.0,
        "delivered_at": "2026-09-20T12:00:00Z",
        "product_category": "Electronics",
        "refundable": True,
    }
    result = evaluate_order_rules(order, reference_date=REF_DATE)
    assert result.forced_decision == BusinessDecision.NEEDS_HUMAN_REVIEW
    assert result.requires_human_review is True
    assert any("$500.00" in r for r in result.review_reasons)
    assert "POL-REFUND-001" in result.citations


def test_expired_30_day_window_ineligible():
    """ORD-1003: Delivered 42 days ago exceeds 30-day window."""
    order = {
        "order_id": "ORD-1003",
        "status": "DELIVERED",
        "total_amount": 85.0,
        "delivered_at": "2026-08-19T12:00:00Z",
        "product_category": "Home Goods",
        "refundable": True,
    }
    result = evaluate_order_rules(order, reference_date=REF_DATE)
    assert result.forced_decision == BusinessDecision.INELIGIBLE
    assert any("30-day" in r for r in result.review_reasons)
    assert "POL-REFUND-001" in result.citations


def test_non_refundable_catalog_category():
    """ORD-1005: Custom Crafts item is strictly non-refundable."""
    order = {
        "order_id": "ORD-1005",
        "status": "DELIVERED",
        "total_amount": 45.0,
        "delivered_at": "2026-09-22T12:00:00Z",
        "product_category": "Custom Crafts",
        "refundable": False,
    }
    result = evaluate_order_rules(order, reference_date=REF_DATE)
    assert result.forced_decision == BusinessDecision.INELIGIBLE
    assert any("Custom Crafts" in r for r in result.review_reasons)
    assert "POL-REFUND-001" in result.citations


def test_active_chargeback_hold_blocks_refund():
    """ORD-1016: Active chargeback strictly blocks refunds and requires human supervisor."""
    order = {
        "order_id": "ORD-1016",
        "status": "CHARGEBACK_HOLD",
        "total_amount": 220.0,
        "delivered_at": "2026-09-18T12:00:00Z",
        "product_category": "Electronics",
        "refundable": True,
    }
    result = evaluate_order_rules(order, reference_date=REF_DATE)
    assert result.forced_decision == BusinessDecision.NEEDS_HUMAN_REVIEW
    assert result.requires_human_review is True
    assert any("chargeback" in r.lower() for r in result.review_reasons)
    assert "POL-DISPUTE-001" in result.citations


def test_duplicate_refund_prevention_status_refunded():
    """Duplicate refund blocked when order status is REFUNDED."""
    order = {
        "order_id": "ORD-1099",
        "status": "REFUNDED",
        "total_amount": 50.0,
        "delivered_at": "2026-09-20T12:00:00Z",
        "product_category": "Apparel",
        "refundable": True,
    }
    result = evaluate_order_rules(order, reference_date=REF_DATE)
    assert result.forced_decision == BusinessDecision.INELIGIBLE
    assert any("already been refunded" in r.lower() for r in result.review_reasons)
    assert "POL-REFUND-001" in result.citations


def test_duplicate_refund_prevention_existing_refund_record():
    """Duplicate refund blocked when operational refund record is COMPLETED."""
    order = {
        "order_id": "ORD-1098",
        "status": "DELIVERED",
        "total_amount": 50.0,
        "delivered_at": "2026-09-20T12:00:00Z",
        "product_category": "Apparel",
        "refundable": True,
    }
    refund = {
        "refund_id": "REF-1098",
        "status": "COMPLETED",
        "amount": 50.0,
    }
    result = evaluate_order_rules(order, reference_date=REF_DATE, refund=refund)
    assert result.forced_decision == BusinessDecision.INELIGIBLE
    assert any("already been refunded" in r.lower() for r in result.review_reasons)


def test_boundary_delivery_window_exact_30_days():
    """Delivered exactly 30 days ago is within the refund window."""
    order = {
        "order_id": "ORD-1030",
        "status": "DELIVERED",
        "total_amount": 100.0,
        "delivered_at": "2026-08-31T12:00:00Z",
        "product_category": "Apparel",
        "refundable": True,
    }
    result = evaluate_order_rules(order, reference_date=REF_DATE)
    assert result.forced_decision is None


def test_boundary_delivery_window_31_days():
    """Delivered 31 days ago exceeds the 30-day window and is INELIGIBLE."""
    order = {
        "order_id": "ORD-1031",
        "status": "DELIVERED",
        "total_amount": 100.0,
        "delivered_at": "2026-08-30T12:00:00Z",
        "product_category": "Apparel",
        "refundable": True,
    }
    result = evaluate_order_rules(order, reference_date=REF_DATE)
    assert result.forced_decision == BusinessDecision.INELIGIBLE
    assert any("30-day" in r for r in result.review_reasons)


def test_empty_order_resilience():
    """Empty or None order does not crash the rules engine."""
    assert evaluate_order_rules(None).forced_decision is None
    assert evaluate_order_rules({}).forced_decision is None
