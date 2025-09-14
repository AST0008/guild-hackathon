"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  MessageSquare,
  Search,
  Plus,
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
  MessageCircle,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import type { CommunicationLog, Customer } from "@/lib/types"

export default function CommunicationsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [communications, setCommunications] = useState<CommunicationLog[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch communications and customers from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [commResponse, customersResponse] = await Promise.all([
          fetch("/api/communications"),
          fetch("/api/customers")
        ])

        if (commResponse.ok) {
          const commData = await commResponse.json()
          setCommunications(commData.communications)
        }

        if (customersResponse.ok) {
          const customersData = await customersResponse.json()
          setCustomers(customersData)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredCommunications = communications.filter((comm) => {
    const customer = customers.find((c) => c.id === comm.customerId)
    const customerName = customer ? `${customer.firstName} ${customer.lastName}` : ""

    const matchesSearch =
      comm.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerName.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === "all" || comm.status === filterStatus

    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-green-100 text-green-800 border-green-200"
      case "delivered":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "scheduled":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "failed":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
      case "delivered":
        return <CheckCircle className="h-4 w-4" />
      case "scheduled":
        return <Clock className="h-4 w-4" />
      case "failed":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail className="h-4 w-4" />
      case "sms":
        return <MessageCircle className="h-4 w-4" />
      case "phone":
        return <Phone className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-6 w-6 text-accent" />
                <h1 className="text-2xl font-bold text-foreground">Communication Hub</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Link href="/conversations">
                <Button variant="outline">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  View Conversations
                </Button>
              </Link>
              <Link href="/communications/schedule">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Communication
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Communications</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="sent">Sent</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search communications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterStatus === "all" ? "default" : "outline"}
                  onClick={() => setFilterStatus("all")}
                  size="sm"
                >
                  All
                </Button>
                <Button
                  variant={filterStatus === "scheduled" ? "default" : "outline"}
                  onClick={() => setFilterStatus("scheduled")}
                  size="sm"
                >
                  Scheduled
                </Button>
                <Button
                  variant={filterStatus === "sent" ? "default" : "outline"}
                  onClick={() => setFilterStatus("sent")}
                  size="sm"
                >
                  Sent
                </Button>
                <Button
                  variant={filterStatus === "delivered" ? "default" : "outline"}
                  onClick={() => setFilterStatus("delivered")}
                  size="sm"
                >
                  Delivered
                </Button>
              </div>
            </div>

            {/* Communications List */}
            <div className="space-y-4">
              {filteredCommunications.map((comm) => {
                const customer = customers.find((c) => c.id === comm.customerId)
                return (
                  <Card key={comm.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="flex items-center space-x-2">
                              {getTypeIcon(comm.type)}
                              <span className="font-medium text-foreground">{comm.subject}</span>
                            </div>
                            <Badge className={getStatusColor(comm.status)}>
                              <div className="flex items-center space-x-1">
                                {getStatusIcon(comm.status)}
                                <span>{comm.status}</span>
                              </div>
                            </Badge>
                          </div>

                          <div className="text-sm text-muted-foreground mb-2">
                            To: {customer ? `${customer.firstName} ${customer.lastName}` : "Unknown Customer"}
                          </div>

                          <p className="text-sm text-foreground mb-3 line-clamp-2">{comm.content}</p>

                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {comm.scheduledFor
                                  ? `Scheduled: ${new Date(comm.scheduledFor).toLocaleString()}`
                                  : comm.sentAt
                                    ? `Sent: ${new Date(comm.sentAt).toLocaleString()}`
                                    : `Created: ${new Date(comm.createdAt).toLocaleString()}`}
                              </span>
                            </div>
                            <span className="capitalize">{comm.type}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                          {comm.status === "scheduled" && (
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {filteredCommunications.length === 0 && (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No communications found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || filterStatus !== "all"
                    ? "Try adjusting your search or filter criteria."
                    : "Get started by scheduling your first communication."}
                </p>
                <Link href="/communications/schedule">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Communication
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>

          <TabsContent value="scheduled" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {communications
                .filter((comm) => comm.status === "scheduled")
                .map((comm) => {
                  const customer = customers.find((c) => c.id === comm.customerId)
                  return (
                    <Card key={comm.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{comm.subject}</CardTitle>
                          <Badge className={getStatusColor(comm.status)}>
                            {getStatusIcon(comm.status)}
                            <span className="ml-1">{comm.status}</span>
                          </Badge>
                        </div>
                        <CardDescription>
                          {customer ? `${customer.firstName} ${customer.lastName}` : "Unknown Customer"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center text-sm text-muted-foreground">
                          {getTypeIcon(comm.type)}
                          <span className="ml-2 capitalize">{comm.type}</span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span className="ml-2">
                            {comm.scheduledFor ? new Date(comm.scheduledFor).toLocaleString() : "Not scheduled"}
                          </span>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                            Edit
                          </Button>
                          <Button size="sm" className="flex-1">
                            Send Now
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
            </div>
          </TabsContent>

          <TabsContent value="sent" className="space-y-6">
            <div className="space-y-4">
              {communications
                .filter((comm) => comm.status === "sent" || comm.status === "delivered")
                .map((comm) => {
                  const customer = customers.find((c) => c.id === comm.customerId)
                  return (
                    <Card key={comm.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              {getTypeIcon(comm.type)}
                              <span className="font-medium">{comm.subject}</span>
                              <Badge className={getStatusColor(comm.status)}>
                                {getStatusIcon(comm.status)}
                                <span className="ml-1">{comm.status}</span>
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              To: {customer ? `${customer.firstName} ${customer.lastName}` : "Unknown Customer"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {comm.sentAt ? `Sent: ${new Date(comm.sentAt).toLocaleString()}` : ""}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Communication Templates</h3>
              <p className="text-muted-foreground mb-4">
                Pre-built templates for common communications will be available here.
              </p>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
