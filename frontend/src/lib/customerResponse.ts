import { InvestigationResult } from "./types";

/**
 * Transforms technical investigation results into human-grade, polite,
 * and executive customer responses ready to dispatch.
 */
export function generateCustomerResponse(
  result: InvestigationResult,
  customerName: string,
  orderId?: string
): string {
  const name = customerName || "Valued Customer";
  const orderRef = orderId || (result.operational_evidence?.order?.order_id as string) || "your order";
  const rawAmount = result.operational_evidence?.order?.total_amount;
  const formattedAmount =
    typeof rawAmount === "number" ? `$${rawAmount.toFixed(2)}` : "the eligible transaction total";

  if (result.decision === "ELIGIBLE") {
    return `Hello ${name},

Thank you for reaching out to AcmeCommerce Customer Care.

Great news! We have investigated your inquiry regarding Order ${orderRef}, and your return and refund request has been officially approved in full accordance with our Standard Return Policy [POL-REFUND-001].

Refund Authorization Summary:
• Approved Amount: ${formattedAmount}
• Destination: Original Payment Method
• Processing Time: 3–5 business days

What to do next:
We have generated a prepaid return shipping label and dispatched it to your email address. Simply pack your item securely with all original packaging and drop it off at any authorized courier location within 7 days. Once carrier receipt is confirmed, your refund will settle automatically.

Thank you for choosing AcmeCommerce!

Warm regards,
AutoResolve Autonomous Customer Operations Team`;
  }

  if (result.decision === "NEEDS_HUMAN_REVIEW") {
    const isHighValue = result.review_reasons?.some((r) => r.includes("$500"));
    const isPromptAttack = result.review_reasons?.some((r) => r.toLowerCase().includes("injection") || r.toLowerCase().includes("override"));

    if (isPromptAttack) {
      return `Hello ${name},

We have received your support inquiry regarding Order ${orderRef}.

Your request has been routed to our Operations Security & Compliance Team for manual verification before any action can be taken. 

Our team will review your account credentials and reach out to your registered email address shortly.

Regards,
AcmeCommerce Trust & Operations`;
    }

    return `Hello ${name},

Thank you for contacting AcmeCommerce Customer Support regarding Order ${orderRef}.

Your inquiry has been prioritized and placed into our Senior Operations Supervisor Queue.

${
  isHighValue
    ? `Because your transaction total (${formattedAmount}) exceeds our $500.00 automated threshold, company financial security policy [POL-REFUND-001] requires secondary supervisor sign-off.`
    : result.reasoning_summary || "Our operational guidelines require manager review for this case."
}

Current Status:
• Review Status: Priority Escalation in Progress
• Assigned Queue: Operations Senior Supervisor Desk
• Estimated Resolution: Within 2–4 business hours

You will receive an automated confirmation email as soon as the supervisor completes the authorization. We appreciate your patience!

Sincerely,
AcmeCommerce Support Desk`;
  }

  if (result.decision === "INELIGIBLE") {
    const reasonText =
      result.review_reasons?.length > 0
        ? result.review_reasons.join(". ")
        : result.reasoning_summary || "Order does not satisfy standard return constraints under company guidelines [POL-REFUND-001].";

    return `Hello ${name},

Thank you for contacting AcmeCommerce Customer Support regarding Order ${orderRef}.

We have carefully evaluated your order history and item details against our published company policies. Unfortunately, we are unable to authorize a return or refund for this transaction.

Policy Determination:
${reasonText}

If you believe this determination was reached in error or if your package was damaged in carrier transit, please reply directly with photo documentation so an agent can conduct a manual secondary review.

Best regards,
AcmeCommerce Customer Experience Team`;
  }

  if (result.decision === "NEEDS_MORE_INFORMATION") {
    return `Hello ${name},

Thank you for reaching out to AcmeCommerce Customer Care.

We would be delighted to look into this for you immediately! To help our automated resolution engine locate your specific order records, could you please provide:

1. Your Order Identifier (formatted as ORD-XXXX, found in your confirmation receipt)
2. Or the billing email address associated with your purchase

As soon as you reply with this information, our autonomous system will inspect your shipment status and assist you without delay.

Kind regards,
AutoResolve Support Operations`;
  }

  return `Hello ${name},

Thank you for contacting AcmeCommerce Support regarding Order ${orderRef}.

We have logged your request in our customer operations portal. Our support team is currently verifying the details and will follow up with an update shortly.

Thank you for your patience!

Sincerely,
AcmeCommerce Support Desk`;
}
