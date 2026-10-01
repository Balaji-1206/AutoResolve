---
document_id: POL-CANCEL-001
document_type: policy
domain: cancellations
version: "1.0"
authority: authoritative
last_updated: "2026-01-01"
---

# AcmeCommerce Order Cancellation Policy

## 1. Purpose
This policy defines the conditions, operational boundaries, and timing constraints under which customer orders may be cancelled prior to or during fulfillment.

## 2. Scope
Applies to all order cancellation inquiries, customer self-service actions, and automated agent cancellation tools.

## 3. Order Lifecycle Definitions
- **CREATED / PENDING_PAYMENT**: The order has been recorded but payment verification or inventory reservation is in progress.
- **PROCESSING**: Payment is secured; the order is queued for warehouse allocation.
- **FULFILLING / PACKED**: Warehouse personnel or automated systems have generated shipping labels and packaged physical merchandise.
- **SHIPPED**: The parcel has been tendered to the logistics carrier with an active tracking number.
- **DELIVERED**: The parcel has reached its final destination.

## 4. Eligibility Rules for Order Cancellation
1. **Self-Service & Automated Cancellation Window**:
   - Orders holding the status `CREATED`, `PENDING_PAYMENT`, or `PROCESSING` with `shipping_status: UNFULFILLED` may be cancelled immediately by automated agents or customer self-service.
   - 100% of the purchase amount, including shipping fees and taxes, is credited back to the original payment method.
2. **Fulfillment Cutoff Point**:
   - As soon as the order transitions to `FULFILLING`, `PACKED`, or `SHIPPED`, automated cancellation is blocked. Once packaging and carrier labeling have occurred, logistics systems cannot guarantee inventory recall.
3. **Cancellation After Shipment Prohibited**:
   - Once an order holds the status `SHIPPED`, it cannot be cancelled under any circumstances.
   - Customers must be instructed to either:
     - Refuse delivery upon arrival by the courier (parcel returns to sender at no fee), or
     - Accept the delivery and initiate a standard return within 30 days under the Refund Policy (POL-REFUND-001).

## 5. Exceptions & Approval Requirements
1. **Custom & Personalized Products**: Orders containing custom-engraved, assembled-to-order, or perishable items cannot be cancelled once production has started (regardless of `UNFULFILLED` status). Cancellation of such items requires human approval.
2. **Emergency Warehouse Intercepts**: For orders marked `FULFILLING` requested within 30 minutes of placement, human approval from warehouse logistics is required to attempt physical parcel intercept.
3. **Refund Processing on Cancellation**: Pre-shipment cancellations release credit card holds immediately or disburse funds within 3–5 business days depending on the customer's financial institution.

## 6. Prohibited Actions
- Agents must never mark an order as `CANCELLED` if tracking confirms it has been handed over to the carrier (`status: SHIPPED`).
- Agents must never promise instant same-day credit card statement updates, as bank processing windows are governed by card issuer networks.

## 7. Escalation Conditions
Escalation to a human supervisor or Logistics Specialist is required when:
- The customer requests cancellation of an order containing non-refundable or custom-built products.
- A technical error occurred where the customer was charged, clicked cancel within 15 minutes, but the status shows `SHIPPED`.
- Bulk cancellation requests involving more than 3 distinct orders simultaneously.

## 8. Concrete Examples
- **Example A (Eligible Auto-Cancellation)**: Order ORD-4001 was placed 45 minutes ago, status is `PROCESSING`, `shipping_status: UNFULFILLED`. Outcome: Agent invokes `cancel_order()`, releases payment hold, and confirms cancellation.
- **Example B (Ineligible Shipped Order)**: Order ORD-4002 was placed 18 hours ago and holds status `SHIPPED` with tracking number `TRK-8812`. Outcome: Cancellation denied; explain courier handoff; provide return instructions upon delivery.
- **Example C (Custom Item Exception)**: Order ORD-4003 is `PROCESSING` but contains custom-monogrammed leather goods. Outcome: Cannot auto-cancel; escalate for human approval.
