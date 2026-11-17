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

Great news! We have reviewed your inquiry regarding Order ${orderRef}, and your return request has been officially approved in full accordance with our Standard 30-Day Return Policy.

Refund Authorization Summary:
• Approved Amount: ${formattedAmount}
• Destination: Original Payment Method
• Processing Time: 3–5 business days

What to do next:
We have generated a prepaid return shipping label and dispatched it to your email address. Simply pack your item securely with all original packaging and drop it off at any authorized courier location within 7 days. Once carrier receipt is confirmed, your refund will settle automatically.

Thank you for choosing AcmeCommerce!

Warm regards,
AcmeCommerce Customer Care Team`;
  }

  if (result.decision === "NEEDS_HUMAN_REVIEW") {
    const isHighValue = result.review_reasons?.some((r) => r.includes("$500"));

    return `Hello ${name},

Thank you for contacting AcmeCommerce Customer Care regarding Order ${orderRef}.

Your inquiry has been received and routed to our Store Care Manager for priority review.

${
  isHighValue
    ? `Because your transaction total (${formattedAmount}) exceeds our $500.00 standard threshold, store policy requires manager authorization before the return label can be issued.`
    : result.reasoning_summary?.replace(/\[POL-[A-Z0-9-]+\]/g, "") || "Our store guidelines require manager review for this case."
}

Current Status:
• Review Status: Store Manager Review in Progress
• Assigned Queue: Customer Care Manager
• Estimated Resolution: Within 2–4 business hours

You will receive an automated confirmation email as soon as the manager completes the review. We appreciate your patience!

Sincerely,
AcmeCommerce Customer Care Team`;
  }

  if (result.decision === "INELIGIBLE") {
    const rawReason =
      result.review_reasons?.length > 0
        ? result.review_reasons.join(". ")
        : result.reasoning_summary || "Order does not satisfy our standard 30-day return policy guidelines.";
    const cleanReason = rawReason.replace(/\[POL-[A-Z0-9-]+\]/g, "").replace(/\(POL-[A-Z0-9-]+\)/g, "").trim();

    return `Hello ${name},

Thank you for contacting AcmeCommerce Customer Care regarding Order ${orderRef}.

We have carefully evaluated your order history and item details against our published store policies. Unfortunately, we are unable to authorize a return or refund for this transaction.

Policy Guidelines:
${cleanReason}

If you believe this determination was reached in error or if your package was damaged during delivery, please reply directly with photo documentation so our team can conduct an exception review.

Best regards,
AcmeCommerce Customer Care Team`;
  }

  if (result.decision === "NEEDS_MORE_INFORMATION") {
    return `Hello ${name},

Thank you for reaching out to AcmeCommerce Customer Care.

We would be delighted to look into this for you immediately! To help locate your specific order records, could you please provide:

1. Your Order Identifier (formatted as ORD-XXXX, found in your confirmation receipt)
2. Or the billing email address associated with your purchase

As soon as you reply with this information, we will verify your shipment status and assist you without delay.

Kind regards,
AcmeCommerce Customer Care Team`;
  }

  return `Hello ${name},

Thank you for contacting AcmeCommerce Support regarding Order ${orderRef}.

We have received your request. Our customer care team is currently verifying the details and will follow up with an update shortly.

Thank you for your patience!

Sincerely,
AcmeCommerce Customer Care Team`;
}
