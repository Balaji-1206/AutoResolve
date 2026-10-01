---
document_id: RUN-ACCOUNT-001
document_type: runbook
domain: accounts
version: "1.0"
authority: operational
last_updated: "2026-01-01"
---

# Operational Runbook: Account Lockout Recovery

## Problem
Customer is unable to sign into their AcmeCommerce account due to automated security lockout (`account_status: LOCKED`).

## Symptoms
- Customer message: "My account is locked", "Too many failed attempts", or "Can't log into my profile".
- Customer profile displays `account_status: LOCKED`.

## Required Information
- Customer identifier (`customer_id`) or registered primary email address.
- Level 1 verification data: 6-digit OTP sent to registered email.
- Secondary verification data: Recent Order ID (`ORD-XXXX`) or registered billing postal code.

## Investigation Steps
1. Query customer profile using `get_customer(customer_id)`.
2. Inspect `account_status` (verify whether `LOCKED`, `SUSPENDED`, or `ACTIVE`).
3. If `account_status == SUSPENDED`, stop and escalate immediately to Fraud & Trust.
4. If `account_status == LOCKED`, determine whether customer wishes to wait for the 30-minute cooldown or proceed with immediate Level 1 Verification.

## Tool Calls Required
- `get_customer(customer_id="CUS-XXXX")`
- `update_ticket(ticket_id="TCK-XXXX", status="RESOLVED", resolution=...)`

## Decision Logic
```
1. VERIFY ACCOUNT STATE:
   IF customer.account_status == "SUSPENDED":
       Inform customer account is undergoing security review.
       ESCALATE to Trust & Safety (Human Approval Required).
       STOP.

   ELSE IF customer.account_status == "ACTIVE":
       Inform customer account is not locked; recommend clearing browser cookies or resetting password.
       STOP.

2. LEVEL 1 VERIFICATION (L1):
   IF customer opts for immediate unlock:
       Step A: Transmit 6-digit OTP to customer.registered_email.
       Step B: Prompt customer for OTP entry.
       Step C: Prompt customer for billing zip code OR recent Order ID.

       IF customer enters correct OTP AND correct secondary factor:
           Update account_status to ACTIVE.
           Advise customer to log in.
           Offer password reset if credentials are forgotten.
       ELSE IF customer fails OTP entry 3 times:
           Update account_status to SUSPENDED.
           ESCALATE to Fraud Prevention.
           STOP.

3. LOSS OF EMAIL ACCESS (L2):
   IF customer reports inability to access registered email inbox:
       Automated agent CANNOT unlock account.
       ESCALATE to Human Support for Level 2 Identity Verification (Photo ID verification required).
```

## Resolution
- Successful L1 Verification: Account unlocked instantly (`ACTIVE`).
- Forgotten credentials: Offer automated password reset link.
- Inability to verify email: Escalation for manual human review.

## Escalation Conditions
- Customer fails verification OTP 3 times consecutively.
- Account status is `SUSPENDED` due to suspected unauthorized access.
- Customer requests changing primary email address without access to existing inbox.

## Security Considerations
- Never read back the full email address or phone number to an unverified user.
- Never bypass the 6-digit OTP verification requirement.
- Never write OTP codes into support ticket text.
