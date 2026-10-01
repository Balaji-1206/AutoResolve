---
document_id: POL-ACCOUNT-001
document_type: policy
domain: accounts
version: "1.0"
authority: authoritative
last_updated: "2026-01-01"
---

# AcmeCommerce Customer Account Policy

## 1. Purpose
This policy sets forth mandatory standards for account access controls, automated account lockout recovery, identity verification protocols, and fraud mitigation.

## 2. Scope
Applies to all customer account actions, profile updates, credential recoveries, and support agent interactions regarding account status.

## 3. Definitions
- **Account Lockout**: Automated security restriction placed on an account (`account_status: LOCKED`) preventing authentication.
- **Level 1 Verification (L1)**: Automated validation consisting of verified email access (One-Time Password / OTP) plus confirmation of a recent Order ID or billing zip code.
- **Level 2 Verification (L2)**: Manual identity validation conducted exclusively by human security personnel via verified government-issued identification.
- **Account Takeover (ATO)**: Unauthorized access or modification of an account by a malicious third party.

## 4. Account Lockout Rules
1. **Trigger Condition**: An account is automatically locked after five (5) consecutive failed authentication attempts within a rolling 15-minute window.
2. **Standard Lockout Duration**: The security lock automatically expires after thirty (30) minutes of inactivity.
3. **Immediate Unlock Eligibility**: A customer may unlock their account immediately prior to the 30-minute cooldown by successfully completing Level 1 Verification through automated support channels.

## 5. Identity Verification Protocol
1. **Requirements for Automated Agent Actions**:
   - Automated agents may only discuss order details or perform account updates if the user passes Level 1 Verification.
   - Required factors:
     a) Receipt of valid 6-digit OTP sent to the registered primary email address.
     b) Correct validation of at least one historical Order ID (`ORD-XXXX`) or registered billing postal code.
2. **Email Address Changes**:
   - Automated agents are strictly prohibited from changing an account's registered email address.
   - Any email address alteration requires Level 2 Verification and human approval by Trust & Safety.

## 6. Suspicious Account Activity & Escalation
1. **Immediate Account Suspension**: An account must be transitioned to `SUSPENDED` status and escalated to Trust & Safety when:
   - Three (3) or more consecutive OTP entries fail during a recovery session.
   - A newly created or recently unlocked account immediately changes delivery address and places an order exceeding $500.00 USD.
   - The verified account owner informs support that their account was accessed by an unauthorized party.
2. **Human Approval Threshold**: Any account reinstatement following a suspension for suspected fraud strictly requires human approval.

## 7. Prohibited Actions
- Agents and automated bots must never disable multi-factor authentication (MFA) or security lockouts without full verification.
- Agents must never disclose the full email address, full phone number, or stored payment details to an unverified caller or chat participant.

## 8. Concrete Examples
- **Example A (Standard Account Unlock)**: Customer locked out after typing wrong password 5 times. Agent triggers 6-digit OTP to registered email `sarah.m@example.com`. Customer inputs correct OTP and confirms billing zip code `94107`. Outcome: Automated agent resets lockout; account status updated to `ACTIVE`.
- **Example B (Unverified Account Access Denied)**: Customer contacts support demanding order history but cannot access registered email address. Outcome: Automated agent denies access to order details; escalates ticket to human operations for Level 2 verification.
- **Example C (Suspicious Takeover Escalation)**: Caller requests password reset, fails OTP twice, and insists on changing email to an unfamiliar domain. Outcome: Immediate account freeze; ticket escalated to Fraud Operations.
