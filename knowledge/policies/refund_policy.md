---
document_id: POL-REFUND-001
document_type: policy
domain: refunds
version: "1.0"
authority: authoritative
last_updated: "2026-01-01"
---

# AcmeCommerce Refund Policy

## 1. Purpose
This policy establishes the authoritative terms, eligibility criteria, and operational limits governing customer refund requests for purchases made on the AcmeCommerce platform.

## 2. Scope
This policy applies to all customer transactions, support operations, automated resolution agents, and human support personnel handling refund inquiries and operations.

## 3. Definitions
- **Delivery Date**: The carrier timestamp recording package delivery (`delivered_at`).
- **Standard Refund Window**: 30 calendar days from recorded delivery.
- **High-Value Threshold**: Any single refund amount strictly exceeding $500.00 USD.
- **Original Payment Method**: The exact credit card, debit card, or digital wallet token utilized during order checkout.
- **Non-Refundable Item**: Products classified as final sale, perishable goods, downloadable software, or personalized/custom-engraved merchandise.

## 4. Eligibility Rules
1. **Submission Window**: The refund request must be submitted within thirty (30) calendar days of the confirmed delivery date. Requests initiated on day 31 or later are ineligible for automatic refund.
2. **Prior Refund Status**: An order or line item that has already been fully refunded cannot be refunded again. A partial refund cannot cause total refunded amounts to exceed the original order total.
3. **Product Classification**: Items flagged with `refundable: false` in the product catalog or order record are ineligible for automated refund.
4. **Order Status**: The target order must hold the status `DELIVERED`, `RETURNED`, or `CANCELLED`. Orders in `PROCESSING` or `SHIPPED` must be resolved via the Cancellation Policy (POL-CANCEL-001) or Shipping Policy (POL-SHIPPING-001).

## 5. Value Limits & Approval Requirements
1. **Automated Refund Limit**: Automated support agents may autonomously issue refunds up to and including $500.00 USD, provided all eligibility conditions are met.
2. **Human Approval Threshold**: Any refund request where the requested amount exceeds $500.00 USD requires human approval before funds can be released.
3. **Discretionary Accommodations**: Concession refunds outside the 30-day window (up to $50.00 store credit) require human approval.

## 6. Processing Timeframes
1. **Review and Approval**: Automated decisions occur instantly upon validation of tool data. Human approval queues resolve within 24 to 48 business hours.
2. **Fund Disbursement**: Once approved, refunds normally process within 5–7 business days back to the customer's original payment method. AcmeCommerce cannot expedite banking processing windows.

## 7. Prohibited Actions
- Automated agents and tier-1 support representatives must NEVER issue refunds to an alternative payment card, bank account, or cash equivalent.
- Agents must NEVER issue a refund against an order with an active chargeback or payment dispute (refer to POL-DISPUTE-001).
- Overriding a non-refundable flag without verified supervisor human approval is strictly prohibited.

## 8. Escalation Conditions
A ticket must be escalated to a human supervisor under any of the following conditions:
- The requested refund exceeds $500.00 USD.
- The customer claims a previous support agent or representative promised a refund contrary to catalog policy.
- The order status shows an active dispute or chargeback (`status: DISPUTED`).
- Potential abuse or fraud patterns (e.g., more than 3 refund claims within 60 days on a single account).

## 9. Decision Boundaries & Concrete Examples
- **Example A (Standard Auto-Refund)**: Order ORD-1001 for $120.00 delivered 14 days ago. Item is refundable, no prior refund exists. Outcome: Approved autonomously; processed in 5–7 business days.
- **Example B (High-Value Human Approval)**: Order ORD-1002 for $750.00 delivered 10 days ago. Eligible item. Outcome: Human approval required before refund execution.
- **Example C (Expired Window)**: Order ORD-1003 delivered 42 days ago. Outcome: Ineligible for refund; explain 30-day limit; escalate only if documented system defect caused delay.
- **Example D (Duplicate Refund Attempt)**: Order ORD-1004 has an existing refund record with status `COMPLETED`. Outcome: Denied; explain order has already been reimbursed.
