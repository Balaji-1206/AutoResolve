---
document_id: POL-PAYMENT-001
document_type: policy
domain: payments
version: "1.0"
authority: authoritative
last_updated: "2026-01-01"
---

# AcmeCommerce Payment Policy

## 1. Purpose
This policy governs payment verification, failed transaction handling, duplicate charge resolution, and security safeguards across AcmeCommerce payment workflows.

## 2. Scope
Applies to all payment operations, checkout transactions, customer inquiries regarding bank charges, and automated agents querying payment system tools.

## 3. Definitions
- **Payment Gateway Status**: The definitive state of a transaction recorded by the gateway: `SUCCESS`, `PENDING`, `FAILED`, `CANCELLED`, or `DISPUTED`.
- **Pending Payment State**: A temporary checkout state where order creation is held for gateway settlement (up to 60 minutes).
- **Duplicate Charge**: Two or more successful charges for identical dollar amounts processed within 24 hours without corresponding multiple orders.
- **Unlinked Charge (Ghost Charge)**: A captured payment with status `SUCCESS` lacking an associated active order record.

## 4. Operational Rules for Payment Status
1. **Failed Payment Interpretation**: A payment with status `FAILED` does not automatically cancel the order immediately. An order remains in `PENDING_PAYMENT` for 60 minutes to permit customer payment retry before transitioning to `CANCELLED`.
2. **Investigation Requirement**: Every failed payment claim must be verified against the payment system using `get_payment()`. Agents must inspect the specific gateway failure reason (e.g., `DECLINED_BY_ISSUER`, `INSUFFICIENT_FUNDS`, `EXPIRED_CARD`).
3. **Missing Order with Successful Payment**: If the payment gateway confirms a status of `SUCCESS` but no active order exists (or order creation failed in the database), the case must be escalated immediately to Payment Operations. Agents must not close the ticket or tell the customer the money was not taken.
4. **Duplicate Charge Resolution**:
   - If two distinct `SUCCESS` payment records are attached to a single order ID, the duplicate payment must be refunded.
   - If the duplicate amount is <= $500.00 USD, an automated resolution agent may process the refund to the original payment method.
   - If the duplicate amount is > $500.00 USD, human approval is strictly required before issuing the reimbursement.

## 5. Security and Data Protection Rules
1. **Zero Credential Exposure**: Payment credentials—including complete 16-digit primary account numbers (PAN), CVV/CVC codes, PINs, and banking passwords—must NEVER be requested, handled, stored, or revealed by agents or automated systems.
2. **Approved Identifier Format**: Only masked card identifiers (card brand plus `last4`, e.g., "Visa ending in 4012") and unique payment IDs (`PAY-XXXX`) may be displayed or logged.
3. **Ticket Sanitization**: Sensitive financial data entered by customers into ticket text must be flagged and omitted from automated agent logs.

## 6. Prohibited Actions
- Agents and automated systems must never capture or record raw payment details in support ticket notes.
- Agents must never manually retry a card on behalf of a customer without using the secured customer-facing checkout link.
- Agents must never issue cash or alternative payment refunds for electronic payment errors.

## 7. Escalation Conditions
Escalation to Payment Operations or Tier-2 Finance is mandatory when:
- A captured charge (`SUCCESS`) has no associated order record.
- Multiple duplicate charges exceed $500.00 USD in aggregate.
- A customer reports unauthorized account charges suggesting identity theft or account takeover.
- The payment gateway reports an unhandled gateway timeout (`GATEWAY_TIMEOUT_504`) with unclear settlement status.

## 8. Concrete Examples
- **Example A (Failed Payment Checkout)**: Customer states card was charged, but payment status shows `FAILED` with reason `INSUFFICIENT_FUNDS`. Order is in `PENDING_PAYMENT`. Outcome: Explain that the bank declined the transaction, no funds were captured, and provide a secure retry link.
- **Example B (Ghost Charge Escalation)**: Customer shows credit card statement charge `PAY-2099` for $180.00, but `get_order(order_id)` returns `NOT_FOUND` or `FAILED_CREATION`. Outcome: Immediate escalation to Payment Operations; do not dismiss.
- **Example C (Duplicate Payment <= $500)**: Customer charged twice ($65.00 each) for Order ORD-2045 due to double-click at checkout. Gateway shows two `SUCCESS` payments. Outcome: Automated refund of the duplicate $65.00 transaction executed immediately.
