---
document_id: RUN-PAYMENT-001
document_type: runbook
domain: payments
version: "1.0"
authority: operational
last_updated: "2026-01-01"
---

# Operational Runbook: Payment Failure Investigation

## Problem
A customer reports that their payment was declined, checkout failed, or their card shows a pending deduction while the order appears unconfirmed.

## Symptoms
- Customer encounters error at checkout: "Payment declined by issuer".
- Order state remains `PENDING_PAYMENT` or transitions to `CANCELLED`.
- Customer inquiries about whether their money was deducted.

## Required Information
- Customer identifier (`customer_id` or verified email).
- Target order identifier (`order_id`) or checkout session reference.
- Approximate transaction timestamp and dollar amount.

## Investigation Steps
1. Retrieve customer profile and verify account status using `get_customer(customer_id)`.
2. Retrieve the order record via `get_order(order_id)`.
3. Retrieve the associated payment transaction via `get_payment(order_id)`.
4. Inspect the `payment_status` and specific gateway `failure_reason`.
5. Check whether any captured payment exists without a valid order record (ghost charge).

## Tool Calls Required
- `get_customer(customer_id="CUS-XXXX")`
- `get_order(order_id="ORD-XXXX")`
- `get_payment(order_id="ORD-XXXX")`

## Decision Logic
```
IF payment_status == "SUCCESS":
    IF order exists AND order.status in ["PROCESSING", "FULFILLING", "SHIPPED", "DELIVERED"]:
        Order is valid; confirm success to customer.
    ELSE IF order does NOT exist OR order.status == "FAILED_CREATION":
        ESCALATE immediately to Payment Operations (Ghost charge anomaly).
ELSE IF payment_status == "FAILED":
    IF failure_reason == "INSUFFICIENT_FUNDS":
        Advise customer that issuer declined for balance; send secure checkout retry link.
    ELSE IF failure_reason == "EXPIRED_CARD":
        Advise customer card expiration date is invalid; send secure checkout retry link.
    ELSE IF failure_reason == "DECLINED_BY_ISSUER":
        Advise customer to contact issuing bank for fraud clearance; provide retry link.
    ELSE IF failure_reason == "GATEWAY_TIMEOUT_504":
        Do not prompt re-billing; check gateway settlement status; if unresolved in 15 min, ESCALATE.
ELSE IF payment_status == "PENDING":
    Explain authorization hold; advise customer to allow up to 30 minutes for settlement.
```

## Resolution
- For confirmed declines: Inform customer that no funds were captured, explain issuer response without exposing sensitive data, and provide secure retry URL.
- For holds: Explain bank temporary hold will drop within 3–5 business days.

## Escalation Conditions
- Escalate to **Payment Operations** if payment status is `SUCCESS` but order record is missing or marked `FAILED_CREATION`.
- Escalate to **Fraud & Security** if the customer claims someone else attempted the payment.
- Escalate if gateway returns unhandled error codes (`ERROR_500_SYSTEM`, `SETTLEMENT_AMBIGUOUS`).

## Security Considerations
- Never request 16-digit card numbers, CVVs, or bank logins in ticket communications.
- Only reference card brand and last four digits (e.g., "Mastercard ending in 1104").
- Never write raw gateway response tokens into customer-facing messages.
