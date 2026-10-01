---
document_id: RUN-REFUND-001
document_type: runbook
domain: refunds
version: "1.0"
authority: operational
last_updated: "2026-01-01"
---

# Operational Runbook: Customer Refund Processing

## Problem
Customer requests a partial or total refund for a previously purchased order.

## Symptoms
- Customer submits return or dissatisfaction request.
- Customer asks: "Where is my refund?" or "Can I get my money back?"

## Required Information
- Customer identifier (`customer_id`).
- Target order identifier (`order_id`).
- Refund justification reason (e.g., return, dissatisfaction, cancellation).
- Desired refund amount (full vs partial).

## Investigation Steps
1. Retrieve customer details using `get_customer(customer_id)`.
2. Retrieve order status, delivery date, and refundable flag via `get_order(order_id)`.
3. Check for any prior refunds using `get_refund(order_id)`.
4. Inspect payment dispute status using `get_payment(order_id)`.

## Tool Calls Required
- `get_customer(customer_id="CUS-XXXX")`
- `get_order(order_id="ORD-XXXX")`
- `get_refund(order_id="ORD-XXXX")`
- `get_payment(order_id="ORD-XXXX")`
- `create_refund(order_id="ORD-XXXX", amount=..., reason=...)`

## Decision Logic
```
1. DISPUTE CHECK:
   IF payment.status == "DISPUTED":
       REJECT REFUND (Double Loss Risk).
       ESCALATE to Payment Operations.
       STOP.

2. PRIOR REFUND CHECK:
   IF prior_refund.status in ["COMPLETED", "PROCESSED", "PENDING"]:
       IF total_refunded + requested_amount > order.amount:
           REJECT REFUND ("Order has already been refunded").
           STOP.

3. ELIGIBILITY CHECK:
   IF order.refundable == false:
       REJECT AUTOMATED REFUND ("Item marked as non-refundable").
       IF customer insists on prior agent promise:
           ESCALATE for HUMAN APPROVAL.
       STOP.

4. TIME WINDOW CHECK:
   days_since_delivery = current_date - order.delivered_at
   IF days_since_delivery > 30:
       REJECT REFUND ("30-day refund window has elapsed").
       STOP.

5. VALUE THRESHOLD CHECK:
   IF requested_amount <= 500.00:
       Execute create_refund(order_id=order_id, amount=requested_amount, reason=reason)
       Inform customer refund approved; processes in 5–7 business days to original payment method.
   ELSE (requested_amount > 500.00):
       FLAG FOR HUMAN APPROVAL.
       Set ticket.should_escalate = true.
       Inform customer that high-value refunds undergo supervisor review within 24–48 hours.
```

## Resolution
- Execute automated refund if amount <= $500.00, within 30 days, refundable item, and no active disputes.
- Explain standard processing timeframe: 5–7 business days to original payment method.

## Escalation Conditions
- Requested refund amount strictly exceeds $500.00 USD.
- Order is marked non-refundable, but customer claims exceptional circumstances or previous agent promise.
- Order has an active bank chargeback or dispute.

## Security Considerations
- Never offer or process refunds to third-party accounts, alternative cards, or cash equivalents.
- Ensure refund amounts do not exceed the original transaction value.
