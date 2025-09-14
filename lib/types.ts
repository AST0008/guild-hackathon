export interface Customer {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
  }
  insuranceInfo: {
    policyNumber?: string
    policyType: string
    premium: number
    startDate?: string
    endDate?: string
    status: "active" | "pending" | "expired" | "cancelled"
  }
  communicationPreferences: {
    email: boolean
    sms: boolean
    phone: boolean
    preferredTime?: string
  }
  notes?: string
}

export interface Document {
  id: string
  name: string
  type: "policy" | "claim" | "payment" | "identification" | "other"
  url: string
  uploadedAt: string
}

export interface CommunicationLog {
  id: string
  customerId: string
  type: "email" | "sms" | "phone" | "meeting"
  subject: string
  content: string
  scheduledFor?: string
  sentAt?: string
  status: "scheduled" | "sent" | "delivered" | "failed"
  createdAt: string
}

// New types for conversation management
export interface ConversationStartRequest {
  lead_id: string
  customer_id: string
  customer_phone: string
  policy_id: string
  agent_type: "renewal" | "new" | "support"
  initial_context: {
    outstanding_amount?: number
    due_date?: string
    language: string
  }
}

export interface ConversationStartResponse {
  conversation_id: string
  job_id: string
  status: string
}

export interface SimulateReplyRequest {
  conversation_id: string
  from_number: string
  text: string
  language: string
}

export interface SimulateReplyResponse {
  message_id: string
  action: string
  mood: {
    label: string
    confidence: number
  }
  outcome: {
    label: string
    confidence: number
  }
}

export interface ConversationMessage {
  id: number
  sender: "assistant" | "customer"
  content: string
  timestamp: string
  mood?: {
    label: string
    confidence: number
  }
  action?: string
  outcome_hint?: {
    label: string
    confidence: number
  }
}

export interface ConversationMetadata {
  lead_id: number
  customer_id: number
  agent_type: string
  channel: string
  language: string
  status: string
  created_at: string
  updated_at: string
}

export interface ConversationDetails {
  conversation_id: number
  metadata: ConversationMetadata
  messages: ConversationMessage[]
  summary: string
  mood_timeline: Array<{
    timestamp: string
    mood: string
    confidence: number
  }>
  tasks: any[]
}

export interface Foresight {
  label: string
  confidence: number
  explain: string
}

export interface ForesightsResponse {
  foresights: Foresight[]
  stored: boolean
}
