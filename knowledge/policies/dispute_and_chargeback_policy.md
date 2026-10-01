---
document_id: POL-DISPUTE-001
document_type: policy
domain: disputes_chargebacks
version: "1.0"
authority: authoritative
last_updated: "2026-01-01"
---

# AcmeCommerce Payment Dispute and Chargeback Policy

## 1. Purpose
This policy specifies mandatory operational protocols for responding to formal credit card chargebacks, payment provider disputes, and customer chargeback inquiries.

## 2. Scope
Applies to all customer support interactions, automated resolution systems, financial tooling, and Payment Operations teams managing transaction disputes.

## 3. Definitions
- **Chargeback / Dispute**: A formal clawback initiated by a customer directly with their credit card issuer or financial institution contesting a charge.
- **Disputed State**: A payment holding `status: DISPUTED` or an order placed on `CHARGEBACK_HOLD`.
- **Double Loss**: Financial condition occurring when a merchant issues a direct customer refund while a bank chargeback is actively processing, resulting in duplicate fund forfeiture plus card brand penalty fees.

## 4. Strict Support Prohibition on Active Disputes
1. **Zero Refund Rule**: Support agents, whether AI or human tier-1, are strictly prohibited from issuing refunds, replacements, or promotional concessions on any transaction with an active dispute (`status: DISPUTED`).
2. **System Enforcement**: Automated tools must reject `create_refund()` operations whenever `payment_status == DISPUTED`.
3. **Customer Communication**: Agents must professionally inform the customer that because the transaction is under active formal investigation with their card-issuing bank, AcmeCommerce cannot modify or refund the funds directly until the bank reaches a decision.

## 5. Dispute Escalation Workflow
1. **Immediate Escalation**: Any ticket involving an active dispute or chargeback notification must be escalated immediately to the specialized Payment Operations / Fraud & Dispute Team.
2. **Evidence Gathering**: The support system will compile order records, delivery proof, and customer interaction logs to provide documentation to the acquiring bank within required card network deadlines.

## 6. Pre-Dispute Claims and Chargeback Threats
1. **Customer Threatens Chargeback**: If a customer states they will file a chargeback but no dispute has officially posted to the payment gateway:
   - Check standard policy eligibility (e.g., refund eligibility under POL-REFUND-001 or shipping investigation under POL-SHIPPING-001).
   - If the request meets standard policy criteria, resolve it through standard authorized workflows before a bank dispute is initiated.
   - If the request violates policy (e.g., item received 90 days ago, non-refundable product) and customer threatens a chargeback to force compliance, escalate the ticket to a human supervisor.
2. **Dispute Withdrawal Workflow**: If a customer offers to drop a filed chargeback in exchange for immediate support assistance, explain that the customer must obtain written confirmation of dispute withdrawal from their issuing bank before AcmeCommerce can unlock the account or process direct adjustments.

## 7. Prohibited Actions
- Agents must never advise a customer to file a fraudulent chargeback or claim "unauthorized transaction" to bypass policy timelines.
- Agents must never issue store credits or gift cards to offset an active chargeback.

## 8. Escalation Conditions
Mandatory human escalation to Payment Operations occurs when:
- The payment gateway marks any transaction as `DISPUTED`.
- A customer submits formal legal or bank dispute documentation through chat or email.
- An account exhibits repeated chargeback activity (>1 dispute across customer lifetime).

## 9. Concrete Examples
- **Example A (Active Chargeback Inquiry)**: Customer asks "Where is the refund for Order ORD-5011? I also disputed it with Chase." System check shows payment status `DISPUTED`. Outcome: Explain that the bank currently controls the funds; decline refund; escalate ticket directly to Payment Operations.
- **Example B (Pre-Dispute Threat within Policy)**: Customer says "Refund my $45 order ORD-5012 right now or I will call my bank and do a chargeback!" Order was delivered 8 days ago, item is refundable. Outcome: Process the eligible refund under standard POL-REFUND-001; defuse threat professionally without escalation.
- **Example C (Pre-Dispute Threat violating Policy)**: Customer demands $800 refund for an order delivered 6 months ago, threatening chargeback. Outcome: Decline automated refund; escalate to human supervisor.
