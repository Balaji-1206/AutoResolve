---
document_id: RUN-PAYMENT-002
document_type: runbook
domain: payments
version: "1.0"
authority: operational
last_updated: "2026-01-01"
---

# Operational Runbook: Duplicate Payment Resolution

## Problem
A customer reports being billed multiple times for what was intended to be a single order or transaction.

## Symptoms
- Customer bank statement exhibits two or more identical charges within a 24-hour window.
- Customer claims a checkout button double-click or network timeout caused repeated charges.

## Required Information
- Customer identifier (`customer_id`).
- Primary order identifier (`order_id`) or billing charge descriptions.
- Exact dollar amounts and timestamps of the duplicate transactions.

## Investigation Steps
1. Verify customer identity via `get_customer(customer_id)`.
2. Retrieve all recent orders for the customer within the last 48 hours.
3. Call `get_payment(order_id)` for the referenced order(s).
4. Inspect payment transaction logs to determine:
   - Scenario A: One single order has two captured payments (`SUCCESS`).
   - Scenario B: Two distinct orders were created accidentally by the customer.
   - Scenario C: One charge is a temporary authorization hold while the other is the captured settlement.

## Tool Calls Required
- `get_customer(customer_id="CUS-XXXX")`
- `get_order(order_id="ORD-XXXX")`
- `get_payment(order_id="ORD-XXXX")`
- `create_refund(order_id="ORD-XXXX", amount=..., reason="DUPLICATE_PAYMENT")`

## Decision Logic
```
IF Scenario == Single Order with Two Captured SUCCESS Payments:
    Identify primary payment and duplicate payment.
    IF duplicate_amount <= 500.00:
        Execute create_refund(order_id=order_id, amount=duplicate_amount, reason="DUPLICATE_PAYMENT")
        Confirm refund to customer (5–7 business days).
    ELSE (duplicate_amount > 500.00):
        Flag for HUMAN APPROVAL.
        Set ticket.should_escalate = true.

ELSE IF Scenario == Two Separate Orders Created:
    Inspect status of duplicate order:
    IF duplicate_order.status in ["CREATED", "PENDING_PAYMENT", "PROCESSING"] AND duplicate_order.shipping_status == "UNFULFILLED":
        Execute cancel_order(order_id=duplicate_order.order_id)
        Confirm pre-shipment cancellation and full refund.
    ELSE IF duplicate_order.status in ["FULFILLING", "SHIPPED", "DELIVERED"]:
        Explain order has already processed/shipped.
        Provide prepaid return instructions under POL-REFUND-001 once delivered.

ELSE IF Scenario == One Settled Charge + One Pending Authorization Hold:
    Explain that the pending item is a temporary pre-authorization hold.
    No second deduction occurred; hold will release in 3–5 business days.
```

## Resolution
- Execute automated refund if duplicate charge <= $500.00.
- If duplicate order unfulfilled, cancel order and void hold.
- Provide timeline expectations: 5–7 business days for refund settlement, 3–5 business days for bank hold release.

## Escalation Conditions
- Duplicate refund amount exceeds $500.00 USD.
- Customer claims charges on an account not matching their customer ID.
- More than two duplicate charges detected on a single transaction.

## Security Considerations
- Mask all card references in correspondence (e.g., "Visa ending in 8831").
- Never solicit bank account numbers or online banking passwords.
