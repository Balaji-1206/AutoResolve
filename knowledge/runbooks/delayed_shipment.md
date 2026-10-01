---
document_id: RUN-SHIPPING-001
document_type: runbook
domain: shipping
version: "1.0"
authority: operational
last_updated: "2026-01-01"
---

# Operational Runbook: Delayed Shipment Remediations

## Problem
Customer inquires regarding an order that has not arrived within the estimated shipping window.

## Symptoms
- Customer message: "Where is my package?", "My shipment is late", or "Tracking hasn't updated".
- Order status is `SHIPPED` with delivery date past due.

## Required Information
- Customer identifier (`customer_id`).
- Target order identifier (`order_id`).
- Carrier tracking number and shipping tier (Standard vs Express).

## Investigation Steps
1. Retrieve order details and shipping tier via `get_order(order_id)`.
2. Calculate days elapsed since carrier dispatch date.
3. Compare actual elapsed business days with tier standard:
   - Standard: 3–5 business days.
   - Express: 1–2 business days.
4. Check consecutive days without tracking scan updates.

## Tool Calls Required
- `get_customer(customer_id="CUS-XXXX")`
- `get_order(order_id="ORD-XXXX")`
- `create_refund(order_id="ORD-XXXX", amount=15.00, reason="EXPRESS_SHIPPING_DELAY")` (if applicable)

## Decision Logic
```
1. CHECK FOR LOST STATUS:
   consecutive_silent_days = current_date - last_scan_date
   IF consecutive_silent_days >= 7:
       TREAT AS LOST PACKAGE:
       IF order.amount <= 500.00:
           Offer customer choice: Free priority replacement OR Full refund.
       ELSE:
           FLAG FOR HUMAN APPROVAL.
       STOP.

2. CHECK DELAY STATUS:
   business_days_overdue = current_business_days - promised_window_max
   IF business_days_overdue <= 0:
       Package is within promised window.
       Inform customer parcel is on schedule; provide carrier tracking link.
       STOP.

3. REMEDIATION RULES:
   IF order.shipping_tier == "EXPRESS" AND business_days_overdue >= 2:
       Automatically refund $15.00 express shipping fee via create_refund().
       Apologize for carrier transit delay.

   IF business_days_overdue > 5:
       Issue automated $20.00 store credit concession.
   
   IF requested_compensation > 50.00:
       REQUIRE HUMAN APPROVAL (Concessions > $50.00 cannot be automated).
       Set ticket.should_escalate = true.
```

## Resolution
- If within window: Reassure customer and supply current carrier tracking status.
- If express delayed >2 days: Auto-refund $15 express fee.
- If lost (silent >= 7 days): Replace or refund order under $500; escalate if > $500.

## Escalation Conditions
- Customer demands monetary compensation exceeding $50.00 USD.
- Total order value exceeds $500.00 USD and is suspected lost.
- Carrier tracking indicates package destroyed or returned to sender with exception.

## Security Considerations
- Verify customer identity before disclosing carrier tracking links or delivery addresses.
