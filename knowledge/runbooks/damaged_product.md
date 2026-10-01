---
document_id: RUN-DAMAGE-001
document_type: runbook
domain: damaged_products
version: "1.0"
authority: operational
last_updated: "2026-01-01"
---

# Operational Runbook: Damaged or Defective Product Resolution

## Problem
Customer reports that merchandise arrived physically broken, leaking, defective, or unusable due to transit or manufacturing damage.

## Symptoms
- Customer message: "My item arrived smashed", "The screen is cracked", or "Product doesn't work out of the box".
- Customer submits attachment images of broken merchandise.

## Required Information
- Customer identifier (`customer_id`).
- Target order identifier (`order_id`).
- Delivery confirmation timestamp (`delivered_at`).
- Photographic evidence of: (a) damaged item, (b) packaging container, (c) carrier shipping label.
- Customer preference: Replacement order vs 100% Refund.

## Investigation Steps
1. Retrieve order details and delivery date using `get_order(order_id)`.
2. Verify that the current date is within fourteen (14) calendar days of `delivered_at`.
3. Verify that photographic evidence has been uploaded and satisfies verification criteria.
4. Check item pricing and hazardous material classification.

## Tool Calls Required
- `get_customer(customer_id="CUS-XXXX")`
- `get_order(order_id="ORD-XXXX")`
- `create_refund(order_id="ORD-XXXX", amount=..., reason="DAMAGED_PRODUCT")` (if customer chooses refund)

## Decision Logic
```
1. REPORTING WINDOW CHECK:
   days_since_delivery = current_date - order.delivered_at
   IF days_since_delivery > 14:
       Reject transit damage claim ("14-day damage reporting window elapsed").
       Direct customer to standard 30-day return policy (if eligible) or warranty.
       STOP.

2. EVIDENCE VERIFICATION:
   IF photo_evidence_provided == false:
       Request customer upload:
       (1) Photo of defect/breakage.
       (2) Photo of outer box condition.
       (3) Photo of carrier shipping label with visible barcode.
       STOP until evidence received.

3. SAFETY / HAZARD CHECK:
   IF damage_type in ["SHATTERED_GLASS", "CHEMICAL_LEAK", "SWOLLEN_BATTERY"]:
       Waive physical return immediately (Hazardous item).
       Proceed directly to resolution.

4. APPROVAL & RESOLUTION RULES:
   IF order.amount > 300.00:
       REQUIRE HUMAN APPROVAL.
       Set ticket.should_escalate = true.
       Inform customer that high-value damage claim is undergoing review.
       STOP.

   ELSE (order.amount <= 300.00):
       // Return requirements for safe physical items:
       IF order.amount > 50.00 AND damage_type not hazardous:
           Issue prepaid return shipping label.
           Trigger replacement / refund upon carrier initial scan.
       ELSE:
           Waive return requirement (customer may dispose/recycle safely).

       // Execute resolution:
       IF customer_preference == "REPLACEMENT":
           Trigger complimentary priority replacement shipment.
       ELSE IF customer_preference == "REFUND":
           Execute create_refund(order_id=order_id, amount=order.amount, reason="DAMAGED_PRODUCT")
           Confirm refund (5–7 business days).
```

## Resolution
- Valid claims <= $300: Autonomous priority replacement or full refund.
- Items <= $50 or hazardous: Return waived.
- Items > $50 (non-hazardous): Prepaid return label provided.

## Escalation Conditions
- Total order value exceeds $300.00 USD.
- Defect resulted in physical injury or property damage (immediate safety escalation).
- Customer account has filed 3 or more damage claims within the past 6 months.

## Security Considerations
- Validate shipping label barcode in submitted photos against actual order tracking number to detect fraudulent stock photos.
- Ensure refund amounts match the damaged line item value.
