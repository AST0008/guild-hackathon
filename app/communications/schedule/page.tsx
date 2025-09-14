"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Send, Calendar, User, MessageSquare, Mail, MessageCircle, Phone, Loader2 } from "lucide-react"
import { communicationTemplates } from "@/lib/communication-templates"
import type { Customer } from "@/lib/types"

export default function ScheduleCommunicationPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [communicationType, setCommunicationType] = useState<"email" | "sms" | "phone">("email")
  const [selectedTemplate, setSelectedTemplate] = useState<string>("default")
  const [subject, setSubject] = useState("")
  const [content, setContent] = useState("")
  const [scheduleDate, setScheduleDate] = useState("")
  const [scheduleTime, setScheduleTime] = useState("")
  const [sendNow, setSendNow] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setIsLoadingCustomers(true)
        const response = await fetch("/api/customers")
        if (!response.ok) {
          throw new Error("Failed to fetch customers")
        }
        const data = await response.json()
        setCustomers(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred")
      } finally {
        setIsLoadingCustomers(false)
      }
    }

    fetchCustomers()
  }, [])

  const availableTemplates = communicationTemplates.filter((t) => t.type === communicationType)
  const selectedTemplateData = communicationTemplates.find((t) => t.id === selectedTemplate)

  const handleTemplateSelect = (templateId: string) => {
    const template = communicationTemplates.find((t) => t.id === templateId)
    if (template) {
      setSelectedTemplate(templateId)
      setSubject(template.subject)
      setContent(template.content)
    } else {
      setSelectedTemplate("")
      setSubject("")
      setContent("")
    }
  }

  const handleCustomerToggle = (customerId: string) => {
    setSelectedCustomers((prev) =>
      prev.includes(customerId) ? prev.filter((id) => id !== customerId) : [...prev, customerId],
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    console.log("Scheduled communication:", {
      customers: selectedCustomers,
      type: communicationType,
      subject,
      content,
      scheduleDate: sendNow ? null : `${scheduleDate}T${scheduleTime}`,
      sendNow,
    })

    router.push("/communications")
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
          <div className="flex items-center space-x-4">
            <Link href="/communications">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Communications
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-6 w-6 text-accent" />
              <h1 className="text-2xl font-bold text-foreground">Schedule Communication</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
          {/* Communication Type */}
          <Card>
            <CardHeader>
              <CardTitle>Communication Type</CardTitle>
              <CardDescription>Choose how you want to communicate with your customers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    communicationType === "email" ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"
                  }`}
                  onClick={() => setCommunicationType("email")}
                >
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-accent" />
                    <div>
                      <h3 className="font-medium">Email</h3>
                      <p className="text-sm text-muted-foreground">Send detailed messages</p>
                    </div>
                  </div>
                </div>
                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    communicationType === "sms" ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"
                  }`}
                  onClick={() => setCommunicationType("sms")}
                >
                  <div className="flex items-center space-x-3">
                    <MessageCircle className="h-5 w-5 text-accent" />
                    <div>
                      <h3 className="font-medium">SMS</h3>
                      <p className="text-sm text-muted-foreground">Quick text messages</p>
                    </div>
                  </div>
                </div>
                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    communicationType === "phone" ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"
                  }`}
                  onClick={() => setCommunicationType("phone")}
                >
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-accent" />
                    <div>
                      <h3 className="font-medium">Phone Call</h3>
                      <p className="text-sm text-muted-foreground">Call script & notes</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-accent" />
                <CardTitle>Select Recipients</CardTitle>
              </div>
              <CardDescription>Choose which customers to send this communication to</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {isLoadingCustomers ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Loading customers...</span>
                  </div>
                ) : error ? (
                  <div className="text-red-600 text-center p-4">{error}</div>
                ) : (
                  customers.map((customer) => (
                    <div key={customer.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        id={customer.id}
                        checked={selectedCustomers.includes(customer.id)}
                        onCheckedChange={() => handleCustomerToggle(customer.id)}
                      />
                      <div className="flex-1">
                        <Label htmlFor={customer.id} className="font-medium cursor-pointer">
                          {customer.firstName} {customer.lastName}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {customer.email} • {customer.phone}
                        </p>
                        <p className="text-xs text-muted-foreground">{customer.insuranceInfo.policyType}</p>
                      </div>
                      <div className="flex items-center space-x-2 text-xs">
                        {customer.communicationPreferences.email && communicationType === "email" && (
                          <span className="text-green-600">✓ Email</span>
                        )}
                        {customer.communicationPreferences.sms && communicationType === "sms" && (
                          <span className="text-green-600">✓ SMS</span>
                        )}
                        {customer.communicationPreferences.phone && communicationType === "phone" && (
                          <span className="text-green-600">✓ Phone</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {customers.length === 0 && !isLoadingCustomers && !error && (
                  <div className="text-center text-muted-foreground p-4">
                    No customers found.
                  </div>
                )}
              </div>
              {selectedCustomers.length > 0 && (
                <p className="text-sm text-muted-foreground mt-3">
                  {selectedCustomers.length} customer{selectedCustomers.length !== 1 ? "s" : ""} selected
                </p>
              )}
            </CardContent>
          </Card>

          {/* Template Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Message Template</CardTitle>
              <CardDescription>Choose a pre-built template or create a custom message</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template">Template</Label>
                <Select onValueChange={handleTemplateSelect} value={selectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a template or start from scratch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Custom Message</SelectItem>
                    {availableTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTemplateData && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Template variables available:</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedTemplateData.variables.map((variable) => (
                      <code key={variable} className="text-xs bg-background px-2 py-1 rounded">
                        {`{${variable}}`}
                      </code>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Message Content */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                {getTypeIcon(communicationType)}
                <CardTitle>Message Content</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {communicationType !== "sms" && (
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter subject line..."
                    required
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="content">{communicationType === "phone" ? "Call Script" : "Message Content"}</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={
                    communicationType === "phone"
                      ? "Enter your call script and talking points..."
                      : "Enter your message content..."
                  }
                  rows={communicationType === "sms" ? 4 : 8}
                  required
                />
                {communicationType === "sms" && (
                  <p className="text-xs text-muted-foreground">Character count: {content.length}/160 (SMS limit)</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Scheduling */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-accent" />
                <CardTitle>Scheduling</CardTitle>
              </div>
              <CardDescription>Choose when to send this communication</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sendNow"
                  checked={sendNow}
                  onCheckedChange={(checked) => setSendNow(checked as boolean)}
                />
                <Label htmlFor="sendNow">Send immediately</Label>
              </div>

              {!sendNow && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="scheduleDate">Date</Label>
                    <Input
                      id="scheduleDate"
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      required={!sendNow}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scheduleTime">Time</Label>
                    <Input
                      id="scheduleTime"
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      required={!sendNow}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Link href="/communications">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting || selectedCustomers.length === 0}>
              {isSubmitting ? (
                <>Processing...</>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {sendNow ? "Send Now" : "Schedule Communication"}
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
