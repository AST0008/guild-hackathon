import { NextRequest, NextResponse } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id

    // Mock foresights data based on conversation ID
    const mockForesights = {
      "1001": {
        foresights: [
          {
            label: "High Renewal Probability",
            confidence: 0.92,
            explain: "Customer showed 3 positive indicators vs 0 negative"
          },
          {
            label: "High Engagement",
            confidence: 0.8,
            explain: "Customer provided detailed responses (45 total words)"
          },
          {
            label: "Payment Intent",
            confidence: 0.85,
            explain: "Customer explicitly asked about payment options"
          }
        ],
        stored: true
      },
      "1002": {
        foresights: [
          {
            label: "New Customer Interest",
            confidence: 0.88,
            explain: "Customer actively seeking quotes and information"
          },
          {
            label: "Auto Insurance Focus",
            confidence: 0.95,
            explain: "Clear preference for auto insurance coverage"
          },
          {
            label: "Price Sensitive",
            confidence: 0.75,
            explain: "Customer immediately asked about rates"
          }
        ],
        stored: true
      }
    }

    const foresights = mockForesights[conversationId as keyof typeof mockForesights] || {
      foresights: [
        {
          label: "Standard Engagement",
          confidence: 0.6,
          explain: "No specific patterns detected in this conversation"
        }
      ],
      stored: true
    }

    return NextResponse.json(foresights)
  } catch (error) {
    console.error("Error generating foresights:", error)
    return NextResponse.json(
      { error: "Failed to generate foresights" },
      { status: 500 }
    )
  }
}
