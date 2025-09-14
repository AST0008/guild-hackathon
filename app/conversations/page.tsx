"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  MessageSquare,
  Search,
  Plus,
  ArrowLeft,
  Phone,
  MessageCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  Brain,
  TrendingUp,
  User,
  Calendar,
  Loader2,
  Send,
  RefreshCw,
} from "lucide-react"
import {
  ConversationDetails,
  ConversationStartRequest,
  ConversationStartResponse,
  SimulateReplyRequest,
  SimulateReplyResponse,
  ForesightsResponse,
} from "@/lib/types"

const API_BASE_URL = "http://localhost:8000"
const LOCAL_API_BASE_URL = "/api"

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<ConversationDetails[]>([])
  const [selectedConversation, setSelectedConversation] = useState<ConversationDetails | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isStartingConversation, setIsStartingConversation] = useState(false)
  const [isSimulatingReply, setIsSimulatingReply] = useState(false)
  const [isGeneratingForesights, setIsGeneratingForesights] = useState(false)
  const [foresights, setForesights] = useState<ForesightsResponse | null>(null)

  // Form states for starting conversations
  const [conversationForm, setConversationForm] = useState<ConversationStartRequest>({
    lead_id: "501",
    customer_id: "201",
    customer_phone: "+1-415-555-0199",
    policy_id: "POL-INS-2024-001",
    agent_type: "renewal",
    initial_context: {
      outstanding_amount: 1500,
      due_date: "2024-02-15",
      language: "en",
    },
  })

  // Form state for simulating replies
  const [replyForm, setReplyForm] = useState<SimulateReplyRequest>({
    conversation_id: "",
    from_number: "+1-415-555-0199",
    text: "",
    language: "en",
  })

  // Mock data for demonstration
  const mockConversations: ConversationDetails[] = [
    {
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
  ]

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch(`${LOCAL_API_BASE_URL}/conversations`)
        if (response.ok) {
          const data = await response.json()
          setConversations(data.conversations)
          if (data.conversations.length > 0) {
            setSelectedConversation(data.conversations[0])
            setReplyForm(prev => ({ ...prev, conversation_id: data.conversations[0].conversation_id.toString() }))
          }
        } else {
          // Fallback to mock data
          setConversations(mockConversations)
          if (mockConversations.length > 0) {
            setSelectedConversation(mockConversations[0])
            setReplyForm(prev => ({ ...prev, conversation_id: mockConversations[0].conversation_id.toString() }))
          }
        }
      } catch (error) {
        console.error("Error fetching conversations:", error)
        // Fallback to mock data
        setConversations(mockConversations)
        if (mockConversations.length > 0) {
          setSelectedConversation(mockConversations[0])
          setReplyForm(prev => ({ ...prev, conversation_id: mockConversations[0].conversation_id.toString() }))
        }
      }
    }

    fetchConversations()
  }, [])

  const startConversation = async () => {
    setIsStartingConversation(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/start_conversation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(conversationForm),
      })
      
      if (response.ok) {
        const data: ConversationStartResponse = await response.json()
        console.log("Conversation started:", data)
        // Refresh conversations list
        // In a real app, you'd fetch the updated list
      }
    } catch (error) {
      console.error("Error starting conversation:", error)
    } finally {
      setIsStartingConversation(false)
    }
  }

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
        // In a real app, you'd update the conversation
        setReplyForm(prev => ({ ...prev, text: "" }))
      }
    } catch (error) {
      console.error("Error simulating reply:", error)
    } finally {
      setIsSimulatingReply(false)
    }
  }

  const generateForesights = async (conversationId: string) => {
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

  const filteredConversations = conversations.filter((conv) =>
    conv.metadata.customer_id.toString().includes(searchTerm) ||
    conv.metadata.agent_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.summary.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/communications">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Communications
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-6 w-6 text-accent" />
                <h1 className="text-2xl font-bold text-foreground">Conversation Management</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={() => generateForesights(selectedConversation?.conversation_id.toString() || "")} disabled={!selectedConversation || isGeneratingForesights}>
                {isGeneratingForesights ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Brain className="h-4 w-4 mr-2" />}
                Generate Foresights
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>Active Conversations</span>
                </CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {filteredConversations.map((conversation) => (
                  <Card
                    key={conversation.conversation_id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedConversation?.conversation_id === conversation.conversation_id
                        ? "ring-2 ring-blue-500 bg-blue-50"
                        : ""
                    }`}
                    onClick={() => setSelectedConversation(conversation)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Customer #{conversation.metadata.customer_id}</span>
                        </div>
                        <Badge className={getMoodColor(conversation.mood_timeline[conversation.mood_timeline.length - 1]?.mood || "neutral")}>
                          {conversation.mood_timeline[conversation.mood_timeline.length - 1]?.mood || "neutral"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {conversation.summary}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(conversation.metadata.updated_at).toLocaleDateString()}</span>
                        </div>
                        <span className="capitalize">{conversation.metadata.agent_type}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Conversation Details */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <div className="space-y-6">
                {/* Conversation Header */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Conversation #{selectedConversation.conversation_id}</CardTitle>
                        <CardDescription>
                          Customer #{selectedConversation.metadata.customer_id} • {selectedConversation.metadata.agent_type} • {selectedConversation.metadata.channel}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getMoodColor(selectedConversation.mood_timeline[selectedConversation.mood_timeline.length - 1]?.mood || "neutral")}>
                          {selectedConversation.mood_timeline[selectedConversation.mood_timeline.length - 1]?.mood || "neutral"}
                        </Badge>
                        <Badge variant="outline">
                          {selectedConversation.metadata.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Messages */}
                <Card>
                  <CardHeader>
                    <CardTitle>Messages</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedConversation.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === "assistant" ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            message.sender === "assistant"
                              ? "bg-muted"
                              : "bg-blue-600 text-white"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <div className="flex items-center justify-between mt-2 text-xs opacity-70">
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
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {foresights.foresights.map((foresight, index) => (
                        <div key={index} className="p-3 bg-muted rounded-lg">
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
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No conversation selected</h3>
                  <p className="text-muted-foreground">Select a conversation from the list to view details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Start New Conversation */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Start New Conversation</CardTitle>
            <CardDescription>Create a new conversation with a customer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Lead ID</label>
                <Input
                  value={conversationForm.lead_id}
                  onChange={(e) => setConversationForm(prev => ({ ...prev, lead_id: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Customer ID</label>
                <Input
                  value={conversationForm.customer_id}
                  onChange={(e) => setConversationForm(prev => ({ ...prev, customer_id: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Customer Phone</label>
                <Input
                  value={conversationForm.customer_phone}
                  onChange={(e) => setConversationForm(prev => ({ ...prev, customer_phone: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Policy ID</label>
                <Input
                  value={conversationForm.policy_id}
                  onChange={(e) => setConversationForm(prev => ({ ...prev, policy_id: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Agent Type</label>
                <Select
                  value={conversationForm.agent_type}
                  onValueChange={(value) => setConversationForm(prev => ({ ...prev, agent_type: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="renewal">Renewal</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Language</label>
                <Select
                  value={conversationForm.initial_context.language}
                  onValueChange={(value) => setConversationForm(prev => ({ 
                    ...prev, 
                    initial_context: { ...prev.initial_context, language: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Outstanding Amount</label>
                <Input
                  type="number"
                  value={conversationForm.initial_context.outstanding_amount || ""}
                  onChange={(e) => setConversationForm(prev => ({ 
                    ...prev, 
                    initial_context: { 
                      ...prev.initial_context, 
                      outstanding_amount: e.target.value ? Number(e.target.value) : undefined
                    }
                  }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Due Date</label>
                <Input
                  type="date"
                  value={conversationForm.initial_context.due_date || ""}
                  onChange={(e) => setConversationForm(prev => ({ 
                    ...prev, 
                    initial_context: { 
                      ...prev.initial_context, 
                      due_date: e.target.value
                    }
                  }))}
                />
              </div>
            </div>
            <Button onClick={startConversation} disabled={isStartingConversation} className="w-full">
              {isStartingConversation ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Start Conversation
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
