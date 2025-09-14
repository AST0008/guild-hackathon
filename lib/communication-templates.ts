export interface CommunicationTemplate {
  id: string
  name: string
  type: "email" | "sms" | "phone"
  category: "reminder" | "welcome" | "renewal" | "claim" | "payment" | "follow-up"
  subject: string
  content: string
  variables: string[] // Available variables like {customerName}, {policyNumber}, etc.
}

export const communicationTemplates: CommunicationTemplate[] = [
  {
    id: "policy-renewal-email",
    name: "Policy Renewal Reminder",
    type: "email",
    category: "renewal",
    subject: "Your {policyType} Policy Renewal - Action Required",
    content: `Dear {customerName},

Your {policyType} policy (#{policyNumber}) is set to expire on {expirationDate}.

To ensure continuous coverage, please review and renew your policy by {renewalDeadline}.

Current Premium: ${"{premium}"}
Policy Details: {policyDetails}

If you have any questions or would like to discuss your coverage options, please don't hesitate to contact us.

Best regards,
{agentName}
{companyName}`,
    variables: [
      "customerName",
      "policyType",
      "policyNumber",
      "expirationDate",
      "renewalDeadline",
      "premium",
      "policyDetails",
      "agentName",
      "companyName",
    ],
  },
  {
    id: "welcome-new-customer",
    name: "Welcome New Customer",
    type: "email",
    category: "welcome",
    subject: "Welcome to {companyName} - Your Policy is Active",
    content: `Dear {customerName},

Welcome to {companyName}! We're excited to have you as our valued customer.

Your {policyType} policy is now active:
- Policy Number: {policyNumber}
- Coverage Start Date: {startDate}
- Annual Premium: ${"{premium}"}

Important documents and policy details are available in your customer portal. If you need assistance or have questions, please contact us at any time.

Thank you for choosing {companyName} for your insurance needs.

Best regards,
{agentName}`,
    variables: ["customerName", "companyName", "policyType", "policyNumber", "startDate", "premium", "agentName"],
  },
  {
    id: "payment-reminder-sms",
    name: "Payment Reminder SMS",
    type: "sms",
    category: "payment",
    subject: "Payment Reminder",
    content:
      'Hi {customerName}, your {policyType} premium of ${"{amount}"} is due on {dueDate}. Pay online or call us at {phoneNumber}. - {companyName}',
    variables: ["customerName", "policyType", "amount", "dueDate", "phoneNumber", "companyName"],
  },
  {
    id: "claim-status-update",
    name: "Claim Status Update",
    type: "email",
    category: "claim",
    subject: "Update on Your Insurance Claim #{claimNumber}",
    content: `Dear {customerName},

We wanted to update you on the status of your insurance claim.

Claim Number: {claimNumber}
Current Status: {claimStatus}
Last Updated: {updateDate}

{statusDetails}

If you have any questions about your claim, please contact our claims department at {claimsPhone} or reply to this email.

Best regards,
Claims Department
{companyName}`,
    variables: [
      "customerName",
      "claimNumber",
      "claimStatus",
      "updateDate",
      "statusDetails",
      "claimsPhone",
      "companyName",
    ],
  },
  {
    id: "follow-up-call",
    name: "Follow-up Call Script",
    type: "phone",
    category: "follow-up",
    subject: "Customer Follow-up Call",
    content: `Hello {customerName},

This is {agentName} from {companyName}. I'm calling to follow up on your recent {interactionType}.

Key points to discuss:
- {discussionPoint1}
- {discussionPoint2}
- {discussionPoint3}

Questions to ask:
- Are you satisfied with your current coverage?
- Do you have any questions about your policy?
- Is there anything else we can help you with?

Next steps: {nextSteps}`,
    variables: [
      "customerName",
      "agentName",
      "companyName",
      "interactionType",
      "discussionPoint1",
      "discussionPoint2",
      "discussionPoint3",
      "nextSteps",
    ],
  },
]

export function replaceTemplateVariables(content: string, variables: Record<string, string>): string {
  let result = content

  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{${key}}`, "g")
    result = result.replace(regex, value || `{${key}}`)
  })

  return result
}
