"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  MessageSquare,
  ArrowLeft,
  Phone,
  MessageCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  Brain,
  User,
  Calendar,
  Loader2,
  Send,
  RefreshCw,
  TrendingUp,
} from "lucide-react"
import {
  ConversationDetails,
  SimulateReplyRequest,
  SimulateReplyResponse,
  ForesightsResponse,
} from "@/lib/types"

const API_BASE_URL = "http://localhost:8000"
const LOCAL_API_BASE_URL = "/api"

export default function ConversationDetailPage() {
  const params = useParams()
  const conversationId = params.id as string
  
  const [conversation, setConversation] = useState<ConversationDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSimulatingReply, setIsSimulatingReply] = useState(false)
  const [isGeneratingForesights, setIsGeneratingForesights] = useState(false)
  const [foresights, setForesights] = useState<ForesightsResponse | null>(null)
  const [replyForm, setReplyForm] = useState<SimulateReplyRequest>({
    conversation_id: conversationId,
    from_number: "+1-415-555-0199",
    text: "",
    language: "en",
  })

  // Mock data for demonstration
  const mockConversation: ConversationDetails = {
    conversation_id: parseInt(conversationId),
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
  }

  useEffect(() => {
    const fetchConversation = async () => {
      try {
        const response = await fetch(`${LOCAL_API_BASE_URL}/conversations/${conversationId}`)
        if (response.ok) {
          const data = await response.json()
          setConversation(data)
        } else {
          // Fallback to mock data
          setConversation(mockConversation)
        }
      } catch (error) {
        console.error("Error fetching conversation:", error)
        // Fallback to mock data
        setConversation(mockConversation)
      } finally {
        setIsLoading(false)
      }
    }

    fetchConversation()
  }, [conversationId])

  const simulateReply = async () => {
    if (!replyForm.text.trim()) return
    
    setIsSimulatingReply(true)
    try {
      const response = await fetch(`${API_BASE_URL}/admin/simulate_reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(replyForm),
      })
      
      if (response.ok) {
        const data: SimulateReplyResponse = await response.json()
        console.log("Reply simulated:", data)
        setReplyForm(prev => ({ ...prev, text: "" }))
      }
    } catch (error) {
      console.error("Error simulating reply:", error)
    } finally {
      setIsSimulatingReply(false)
    }
  }

  const generateForesights = async () => {
    setIsGeneratingForesights(true)
    try {
      const response = await fetch(`${LOCAL_API_BASE_URL}/conversations/${conversationId}/foresights`, {
        method: "POST",
      })
      
      if (response.ok) {
        const data: ForesightsResponse = await response.json()
        setForesights(data)
      }
    } catch (error) {
      console.error("Error generating foresights:", error)
    } finally {
      setIsGeneratingForesights(false)
    }
  }

  const getMoodColor = (mood: string) => {
    switch (mood.toLowerCase()) {
      case "receptive":
      case "helpful":
        return "bg-green-100 text-green-800 border-green-200"
      case "neutral":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "frustrated":
      case "angry":
        return "bg-red-100 text-red-800 border-red-200"
      case "confused":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getOutcomeColor = (outcome: string) => {
    switch (outcome.toLowerCase()) {
      case "payment promised":
      case "payment processing":
        return "bg-green-100 text-green-800 border-green-200"
      case "needs follow-up":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "no interest":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-muted-foreground">Loading conversation...</p>
        </div>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Conversation not found</h3>
          <p className="text-muted-foreground mb-4">The conversation you're looking for doesn't exist.</p>
          <Link href="/conversations">
            <Button>Back to Conversations</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/conversations">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Conversations
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-6 w-6 text-accent" />
                <h1 className="text-2xl font-bold text-foreground">Conversation #{conversationId}</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={generateForesights} disabled={isGeneratingForesights}>
                {isGeneratingForesights ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Brain className="h-4 w-4 mr-2" />}
                Generate Foresights
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Conversation Info */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Conversation Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Conversation Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Customer ID</span>
                    <span className="text-sm text-muted-foreground">#{conversation.metadata.customer_id}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Agent Type</span>
                    <Badge variant="outline" className="capitalize">
                      {conversation.metadata.agent_type}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Channel</span>
                    <div className="flex items-center space-x-1">
                      {conversation.metadata.channel === "sms" ? (
                        <MessageCircle className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Phone className="h-4 w-4 text-green-600" />
                      )}
                      <span className="text-sm text-muted-foreground capitalize">
                        {conversation.metadata.channel}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Language</span>
                    <span className="text-sm text-muted-foreground uppercase">
                      {conversation.metadata.language}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status</span>
                    <Badge className={getMoodColor(conversation.metadata.status)}>
                      {conversation.metadata.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Created</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(conversation.metadata.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Updated</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(conversation.metadata.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Mood Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Mood Timeline</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {conversation.mood_timeline.map((mood, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {new Date(mood.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <Badge className={getMoodColor(mood.mood)}>
                        {mood.mood} ({Math.round(mood.confidence * 100)}%)
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{conversation.summary}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Messages and Actions */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Messages */}
              <Card>
                <CardHeader>
                  <CardTitle>Messages</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {conversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === "assistant" ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          message.sender === "assistant"
                            ? "bg-muted"
                            : "bg-blue-600 text-white"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <div className="flex items-center justify-between mt-3 text-xs opacity-70">
                          <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                          {message.mood && (
                            <Badge className={`text-xs ${getMoodColor(message.mood.label)}`}>
                              {message.mood.label} ({Math.round(message.mood.confidence * 100)}%)
                            </Badge>
                          )}
                        </div>
                        {message.outcome_hint && (
                          <div className="mt-2">
                            <Badge className={`text-xs ${getOutcomeColor(message.outcome_hint.label)}`}>
                              {message.outcome_hint.label} ({Math.round(message.outcome_hint.confidence * 100)}%)
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Simulate Reply */}
              <Card>
                <CardHeader>
                  <CardTitle>Simulate Customer Reply</CardTitle>
                  <CardDescription>Test the conversation flow by simulating customer responses</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Enter customer reply..."
                      value={replyForm.text}
                      onChange={(e) => setReplyForm(prev => ({ ...prev, text: e.target.value }))}
                      onKeyPress={(e) => e.key === "Enter" && simulateReply()}
                    />
                    <Button onClick={simulateReply} disabled={isSimulatingReply || !replyForm.text.trim()}>
                      {isSimulatingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Foresights */}
              {foresights && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Brain className="h-5 w-5" />
                      <span>AI Foresights</span>
                    </CardTitle>
                    <CardDescription>AI-generated insights about this conversation</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {foresights.foresights.map((foresight, index) => (
                      <div key={index} className="p-4 bg-muted rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{foresight.label}</span>
                          <Badge className="bg-blue-100 text-blue-800">
                            {Math.round(foresight.confidence * 100)}%
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{foresight.explain}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
