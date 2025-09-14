"use client"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  MessageSquare,
  CreditCard,
  User,
  Shield,
} from "lucide-react"
import type { Customer, CommunicationLog } from "@/lib/types"

export default function CustomerDetailPage() {
  const params = useParams()
  const customerId = params.id as string
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [customerCommunications, setCustomerCommunications] = useState<CommunicationLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        // Fetch customer data
        const customerResponse = await fetch("/api/customers")
        if (customerResponse.ok) {
          const customers = await customerResponse.json()
          const foundCustomer = customers.find((c: Customer) => c.id === customerId)
          setCustomer(foundCustomer)
        }

        // Fetch communications data
        const commResponse = await fetch("/api/communications")
        if (commResponse.ok) {
          const communications = await commResponse.json()
          const customerComms = communications.filter((c: CommunicationLog) => c.customerId === customerId)
          setCustomerCommunications(customerComms)
        }
      } catch (error) {
        console.error("Error fetching customer data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCustomerData()
  }, [customerId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-muted-foreground">Loading customer data...</div>
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Customer Not Found</h2>
          <p className="text-muted-foreground mb-4">The customer you're looking for doesn't exist.</p>
          <Link href="/customers">
            <Button>Back to Customers</Button>
          </Link>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "expired":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/customers">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Customers
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {customer.firstName} {customer.lastName}
                </h1>
                <p className="text-muted-foreground">{customer.insuranceInfo.policyType}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(customer.insuranceInfo.status)}>{customer.insuranceInfo.status}</Badge>
              <Link href={`/customers/${customer.id}/edit`}>
                <Button>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Customer
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-accent" />
                  <CardTitle>Personal Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                    <p className="text-foreground">
                      {customer.firstName} {customer.lastName}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                    <p className="text-foreground">{new Date(customer.dateOfBirth).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <p className="text-foreground">{customer.email}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <p className="text-foreground">{customer.phone}</p>
                    </div>
                  </div>
                </div>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Address</label>
                  <div className="flex items-start space-x-2 mt-1">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-foreground">{customer.address.street}</p>
                      <p className="text-foreground">
                        {customer.address.city}, {customer.address.state} {customer.address.zipCode}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Insurance Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-accent" />
                  <CardTitle>Insurance Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customer.insuranceInfo.policyNumber && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Policy Number</label>
                      <p className="text-foreground font-mono">{customer.insuranceInfo.policyNumber}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Policy Type</label>
                    <p className="text-foreground">{customer.insuranceInfo.policyType}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Annual Premium</label>
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <p className="text-foreground font-semibold">
                        ${customer.insuranceInfo.premium.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="mt-1">
                      <Badge className={getStatusColor(customer.insuranceInfo.status)}>
                        {customer.insuranceInfo.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Policy Period</label>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="text-foreground">
                        {customer.insuranceInfo.startDate ? new Date(customer.insuranceInfo.startDate).toLocaleDateString() : "N/A"} -{" "}
                        {customer.insuranceInfo.endDate ? new Date(customer.insuranceInfo.endDate).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {customer.notes?.trim() && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground">{customer.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full bg-transparent" variant="outline">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
                <Button className="w-full bg-transparent" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Document
                </Button>
                <Button className="w-full bg-transparent" variant="outline">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Create Payment QR
                </Button>
              </CardContent>
            </Card>

            {/* Communication Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Communication Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Email</span>
                  <Badge variant={customer.communicationPreferences.email ? "default" : "secondary"}>
                    {customer.communicationPreferences.email ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">SMS</span>
                  <Badge variant={customer.communicationPreferences.sms ? "default" : "secondary"}>
                    {customer.communicationPreferences.sms ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Phone</span>
                  <Badge variant={customer.communicationPreferences.phone ? "default" : "secondary"}>
                    {customer.communicationPreferences.phone ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div className="pt-2">
                  <span className="text-sm text-muted-foreground">Preferred Time:</span>
                  <p className="text-sm font-medium capitalize">{customer.communicationPreferences.preferredTime}</p>
                </div>
              </CardContent>
            </Card>

            {/* Recent Communications */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Communications</CardTitle>
              </CardHeader>
              <CardContent>
                {customerCommunications.length > 0 ? (
                  <div className="space-y-3">
                    {customerCommunications.slice(0, 3).map((comm) => (
                      <div key={comm.id} className="border-l-2 border-accent pl-3">
                        <p className="text-sm font-medium">{comm.subject}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {comm.type} • {comm.status}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No recent communications</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
