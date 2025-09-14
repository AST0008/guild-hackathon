export interface DocumentTemplate {
  id: string
  name: string
  type: "policy" | "claim" | "quote" | "renewal" | "certificate"
  description: string
  fields: DocumentField[]
}

export interface DocumentField {
  id: string
  label: string
  type: "text" | "number" | "date" | "select" | "checkbox"
  required: boolean
  placeholder?: string
  options?: string[]
  customerDataPath?: string // Path to customer data property
}

export const documentTemplates: DocumentTemplate[] = [
  {
    id: "auto-policy",
    name: "Auto Insurance Policy",
    type: "policy",
    description: "Standard auto insurance policy document",
    fields: [
      {
        id: "policyNumber",
        label: "Policy Number",
        type: "text",
        required: true,
        customerDataPath: "insuranceInfo.policyNumber",
      },
      {
        id: "customerName",
        label: "Customer Name",
        type: "text",
        required: true,
        customerDataPath: "firstName,lastName",
      },
      {
        id: "customerEmail",
        label: "Email Address",
        type: "text",
        required: true,
        customerDataPath: "email",
      },
      {
        id: "customerPhone",
        label: "Phone Number",
        type: "text",
        required: true,
        customerDataPath: "phone",
      },
      {
        id: "customerAddress",
        label: "Address",
        type: "text",
        required: true,
        customerDataPath: "address.street,address.city,address.state,address.zipCode",
      },
      {
        id: "vehicleYear",
        label: "Vehicle Year",
        type: "number",
        required: true,
        placeholder: "2024",
      },
      {
        id: "vehicleMake",
        label: "Vehicle Make",
        type: "text",
        required: true,
        placeholder: "Toyota",
      },
      {
        id: "vehicleModel",
        label: "Vehicle Model",
        type: "text",
        required: true,
        placeholder: "Camry",
      },
      {
        id: "coverage",
        label: "Coverage Type",
        type: "select",
        required: true,
        options: ["Liability Only", "Comprehensive", "Full Coverage"],
      },
      {
        id: "premium",
        label: "Annual Premium",
        type: "number",
        required: true,
        customerDataPath: "insuranceInfo.premium",
      },
      {
        id: "startDate",
        label: "Policy Start Date",
        type: "date",
        required: true,
        customerDataPath: "insuranceInfo.startDate",
      },
      {
        id: "endDate",
        label: "Policy End Date",
        type: "date",
        required: true,
        customerDataPath: "insuranceInfo.endDate",
      },
    ],
  },
  {
    id: "home-policy",
    name: "Home Insurance Policy",
    type: "policy",
    description: "Standard home insurance policy document",
    fields: [
      {
        id: "policyNumber",
        label: "Policy Number",
        type: "text",
        required: true,
        customerDataPath: "insuranceInfo.policyNumber",
      },
      {
        id: "customerName",
        label: "Customer Name",
        type: "text",
        required: true,
        customerDataPath: "firstName,lastName",
      },
      {
        id: "customerEmail",
        label: "Email Address",
        type: "text",
        required: true,
        customerDataPath: "email",
      },
      {
        id: "propertyAddress",
        label: "Property Address",
        type: "text",
        required: true,
        customerDataPath: "address.street,address.city,address.state,address.zipCode",
      },
      {
        id: "propertyValue",
        label: "Property Value",
        type: "number",
        required: true,
        placeholder: "250000",
      },
      {
        id: "dwellingCoverage",
        label: "Dwelling Coverage",
        type: "number",
        required: true,
        placeholder: "200000",
      },
      {
        id: "personalProperty",
        label: "Personal Property Coverage",
        type: "number",
        required: true,
        placeholder: "100000",
      },
      {
        id: "premium",
        label: "Annual Premium",
        type: "number",
        required: true,
        customerDataPath: "insuranceInfo.premium",
      },
      {
        id: "startDate",
        label: "Policy Start Date",
        type: "date",
        required: true,
        customerDataPath: "insuranceInfo.startDate",
      },
      {
        id: "endDate",
        label: "Policy End Date",
        type: "date",
        required: true,
        customerDataPath: "insuranceInfo.endDate",
      },
    ],
  },
  {
    id: "claim-form",
    name: "Insurance Claim Form",
    type: "claim",
    description: "Standard insurance claim form",
    fields: [
      {
        id: "claimNumber",
        label: "Claim Number",
        type: "text",
        required: true,
        placeholder: "CLM-2024-001",
      },
      {
        id: "policyNumber",
        label: "Policy Number",
        type: "text",
        required: true,
        customerDataPath: "insuranceInfo.policyNumber",
      },
      {
        id: "customerName",
        label: "Customer Name",
        type: "text",
        required: true,
        customerDataPath: "firstName,lastName",
      },
      {
        id: "incidentDate",
        label: "Date of Incident",
        type: "date",
        required: true,
      },
      {
        id: "incidentDescription",
        label: "Description of Incident",
        type: "text",
        required: true,
        placeholder: "Describe what happened...",
      },
      {
        id: "damageAmount",
        label: "Estimated Damage Amount",
        type: "number",
        required: true,
        placeholder: "5000",
      },
      {
        id: "policeReport",
        label: "Police Report Filed",
        type: "checkbox",
        required: false,
      },
    ],
  },
]

export function getCustomerDataValue(customer: any, path: string): string {
  if (!path) return ""

  // Handle comma-separated paths (for combining fields)
  if (path.includes(",")) {
    const paths = path.split(",")
    return paths
      .map((p) => getCustomerDataValue(customer, p.trim()))
      .filter(Boolean)
      .join(" ")
  }

  // Handle nested paths with dot notation
  const keys = path.split(".")
  let value = customer

  for (const key of keys) {
    if (value && typeof value === "object" && key in value) {
      value = value[key]
    } else {
      return ""
    }
  }

  return value?.toString() || ""
}
