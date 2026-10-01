---
document_id: RUN-SHIPPING-002
document_type: runbook
domain: shipping
version: "1.0"
authority: operational
last_updated: "2026-01-01"
---

# Operational Runbook: Delivered But Not Received (DNF) Investigation

## Problem
Logistics tracking indicates an order was `DELIVERED`, but the customer asserts the parcel was never received.

## Symptoms
- Customer message: "Tracking says delivered today, but there's nothing at my door."
- Discrepancy between carrier completion scan and physical possession.

## Required Information
- Customer identifier (`customer_id`).
- Target order identifier (`order_id`).
- Carrier delivery timestamp (`delivered_at`).
- Verification that local areas (porch, lockers, building desk, neighbors) were checked.

## Investigation Steps
1. Retrieve order and tracking metadata via `get_order(order_id)`.
2. Verify delivery address on file against customer address in `get_customer(customer_id)`.
3. Calculate hours elapsed since the carrier recorded the `DELIVERED` scan.
4. Review customer account history for prior non-receipt claims.

## Tool Calls Required
- `get_customer(customer_id="CUS-XXXX")`
- `get_order(order_id="ORD-XXXX")`
- `create_refund(order_id="ORD-XXXX", amount=..., reason="DELIVERED_NOT_RECEIVED")` (if applicable)

## Decision Logic
```
1. 24-HOUR BUFFER RULE:
   hours_since_delivery = current_timestamp - order.delivered_at
   IF hours_since_delivery < 24:
       Explain that couriers frequently scan items delivered prematurely during final runs.
       Instruct customer to allow the full 24-hour buffer to elapse.
       Advise checking parcel lockers, porch areas, and immediate neighbors.
       Provide ticket reference for immediate follow-up if still unlocated at hour 25.
       STOP (No refund or reshipment permitted within 24 hours).

2. POST-24-HOUR INVESTIGATION:
   IF customer confirms parcel remains missing after 24 hours:
       Check customer claim history:
       IF customer.prior_dnf_claims >= 3 in 12 months:
           ESCALATE to Fraud & Risk Management.
           STOP.

       Check order valuation:
       IF order.amount <= 250.00:
           Authorize automated resolution based on customer choice:
           - Trigger free priority replacement reshipment, OR
           - Execute create_refund(order_id=order_id, amount=order.amount, reason="DELIVERED_NOT_RECEIVED")
       ELSE (order.amount > 250.00):
           REQUIRE HUMAN APPROVAL and file carrier tracer investigation.
           Set ticket.should_escalate = true.
           Inform customer carrier investigation initiated (resolution within 48 hours).
```

## Resolution
- Within 24 hours: Informative hold with search guidance.
- After 24 hours (<= $250): Autonomous replacement or full refund.
- After 24 hours (> $250): Carrier tracer ticket routed for human approval.

## Escalation Conditions
- Order amount strictly exceeds $250.00 USD.
- Account exhibits 3 or more missing package claims within past 12 months.
- Carrier records physical recipient signature, but customer disputes signature authenticity.

## Security Considerations
- Never disclose full credit card or unmasked phone data during delivery verification.
- Prevent repeat address spoofing by verifying shipping zip code against profile.
