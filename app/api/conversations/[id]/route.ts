import { NextRequest, NextResponse } from "next/server"

// Mock conversation data
const mockConversations = {
  "1001": {
    conversation_id: 1001,
    metadata: {
      lead_id: 501,
      customer_id: 201,
      agent_type: "renewal",
      channel: "sms",
      language: "en",
      status: "active",
      created_at: "2024-01-15T10:30:00Z",
      updated_at: "2024-01-15T10:45:00Z",
    },
    messages: [
      {
        id: 1,
        sender: "assistant",
        content: "Hi Sarah! This is Alex from Premier Insurance. I noticed your policy POL-INS-2024-001 is due for renewal on February 15th. Would you like to discuss your renewal options?",
        timestamp: "2024-01-15T10:30:00Z",
        mood: { label: "neutral", confidence: 0.6 },
        action: "reply",
        outcome_hint: { label: "Needs Follow-up", confidence: 0.7 },
      },
      {
        id: 2,
        sender: "customer",
        content: "Yes, I would like to renew my policy. How much will it cost?",
        timestamp: "2024-01-15T10:32:00Z",
        mood: { label: "receptive", confidence: 0.8 },
        action: "request_payment",
        outcome_hint: { label: "Payment Promised", confidence: 0.7 },
      },
      {
        id: 3,
        sender: "assistant",
        content: "Great! Your renewal premium will be $1,500, which is the same as last year. I can process this for you right now. Would you like to pay via credit card or bank transfer?",
        timestamp: "2024-01-15T10:33:00Z",
        mood: { label: "helpful", confidence: 0.9 },
        action: "payment_processing",
        outcome_hint: { label: "Payment Processing", confidence: 0.8 },
      },
    ],
    summary: "Customer interested in renewal, discussed payment options",
    mood_timeline: [
      { timestamp: "2024-01-15T10:30:00Z", mood: "neutral", confidence: 0.6 },
      { timestamp: "2024-01-15T10:32:00Z", mood: "receptive", confidence: 0.8 },
      { timestamp: "2024-01-15T10:33:00Z", mood: "helpful", confidence: 0.9 },
    ],
    tasks: [],
  },
  "1002": {
    conversation_id: 1002,
    metadata: {
      lead_id: 502,
      customer_id: 202,
      agent_type: "new",
      channel: "sms",
      language: "en",
      status: "active",
      created_at: "2024-01-15T11:00:00Z",
      updated_at: "2024-01-15T11:15:00Z",
    },
    messages: [
      {
        id: 1,
        sender: "assistant",
        content: "Hello! I'm Alex from Premier Insurance. I understand you're interested in getting a new insurance policy. What type of coverage are you looking for?",
        timestamp: "2024-01-15T11:00:00Z",
        mood: { label: "neutral", confidence: 0.7 },
        action: "reply",
        outcome_hint: { label: "Needs Follow-up", confidence: 0.6 },
      },
      {
        id: 2,
        sender: "customer",
        content: "I need auto insurance for my new car. What are your rates?",
        timestamp: "2024-01-15T11:02:00Z",
        mood: { label: "interested", confidence: 0.8 },
        action: "request_quote",
        outcome_hint: { label: "Quote Requested", confidence: 0.9 },
      },
    ],
    summary: "New customer inquiry for auto insurance",
    mood_timeline: [
      { timestamp: "2024-01-15T11:00:00Z", mood: "neutral", confidence: 0.7 },
      { timestamp: "2024-01-15T11:02:00Z", mood: "interested", confidence: 0.8 },
    ],
    tasks: [],
  },
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id
    const conversation = mockConversations[conversationId as keyof typeof mockConversations]

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(conversation)
  } catch (error) {
    console.error("Error fetching conversation:", error)
    return NextResponse.json(
      { error: "Failed to fetch conversation" },
      { status: 500 }
    )
  }
}
