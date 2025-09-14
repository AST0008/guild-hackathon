"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QrCode, Search, Plus, ArrowLeft, DollarSign, Share, Copy, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { formatCurrency } from "@/lib/qr-utils"
import type { PaymentQRData } from "@/lib/qr-utils"

export default function PaymentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [paymentQRs, setPaymentQRs] = useState<PaymentQRData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>("all")

  // Fetch payment QR codes from API
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await fetch("/api/payments")
        if (response.ok) {
          const data = await response.json()
          setPaymentQRs(data.payments)
        }
      } catch (error) {
        console.error("Error fetching payments:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPayments()
  }, [])

  const filteredPayments = paymentQRs.filter((payment) => {
    const matchesSearch =
      payment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.policyNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.description.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === "all" || payment.status === filterStatus

    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200"
      case "paid":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "expired":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Clock className="h-4 w-4" />
      case "paid":
        return <CheckCircle className="h-4 w-4" />
      case "expired":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // In a real app, you'd show a toast notification here
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
                <QrCode className="h-6 w-6 text-accent" />
                <h1 className="text-2xl font-bold text-foreground">Payment QR Codes</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Link href="/payments/generate">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate QR Code
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All QR Codes</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="paid">Paid</TabsTrigger>
            <TabsTrigger value="expired">Expired</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by customer, policy, or description..."
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
                  variant={filterStatus === "active" ? "default" : "outline"}
                  onClick={() => setFilterStatus("active")}
                  size="sm"
                >
                  Active
                </Button>
                <Button
                  variant={filterStatus === "paid" ? "default" : "outline"}
                  onClick={() => setFilterStatus("paid")}
                  size="sm"
                >
                  Paid
                </Button>
                <Button
                  variant={filterStatus === "expired" ? "default" : "outline"}
                  onClick={() => setFilterStatus("expired")}
                  size="sm"
                >
                  Expired
                </Button>
              </div>
            </div>

            {/* Payment QR Codes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPayments.map((payment) => (
                <Card key={payment.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{payment.customerName}</CardTitle>
                        <CardDescription className="text-sm">{payment.policyNumber}</CardDescription>
                      </div>
                      <Badge className={getStatusColor(payment.status)}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(payment.status)}
                          <span>{payment.status}</span>
                        </div>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Amount:</span>
                        <span className="font-semibold text-foreground">{formatCurrency(payment.amount)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Due Date:</span>
                        <span className="text-foreground">{new Date(payment.dueDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Expires:</span>
                        <span className="text-foreground">{new Date(payment.expiresAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <p className="line-clamp-2">{payment.description}</p>
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/payments/${payment.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full bg-transparent">
                          <QrCode className="h-4 w-4 mr-2" />
                          View QR
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(payment.paymentUrl)}
                        className="bg-transparent"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="bg-transparent">
                        <Share className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredPayments.length === 0 && (
              <div className="text-center py-12">
                <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No payment QR codes found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || filterStatus !== "all"
                    ? "Try adjusting your search or filter criteria."
                    : "Get started by generating your first payment QR code."}
                </p>
                <Link href="/payments/generate">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Generate QR Code
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>

          {/* Other tab contents would be similar with filtered data */}
          <TabsContent value="active">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paymentQRs
                .filter((payment) => payment.status === "active")
                .map((payment) => (
                  <Card key={payment.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{payment.customerName}</CardTitle>
                      <CardDescription>
                        {formatCurrency(payment.amount)} due {new Date(payment.dueDate).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link href={`/payments/${payment.id}`}>
                        <Button className="w-full">
                          <QrCode className="h-4 w-4 mr-2" />
                          View QR Code
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="paid">
            <div className="space-y-4">
              {paymentQRs
                .filter((payment) => payment.status === "paid")
                .map((payment) => (
                  <Card key={payment.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{payment.customerName}</p>
                          <p className="text-sm text-muted-foreground">{formatCurrency(payment.amount)} • Paid</p>
                        </div>
                        <Badge className={getStatusColor(payment.status)}>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Paid
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="expired">
            <div className="space-y-4">
              {paymentQRs
                .filter((payment) => payment.status === "expired")
                .map((payment) => (
                  <Card key={payment.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{payment.customerName}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(payment.amount)} • Expired{" "}
                            {new Date(payment.expiresAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(payment.status)}>
                            <AlertCircle className="h-4 w-4 mr-1" />
                            Expired
                          </Badge>
                          <Button variant="outline" size="sm">
                            Regenerate
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-12">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <QrCode className="h-5 w-5 text-accent" />
                <div>
                  <div className="text-2xl font-bold text-foreground">{paymentQRs.length}</div>
                  <p className="text-sm text-muted-foreground">Total QR Codes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {paymentQRs.filter((p) => p.status === "active").length}
                  </div>
                  <p className="text-sm text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {paymentQRs.filter((p) => p.status === "paid").length}
                  </div>
                  <p className="text-sm text-muted-foreground">Paid</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-accent" />
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {formatCurrency(paymentQRs.reduce((sum, p) => sum + (p.status === "paid" ? p.amount : 0), 0))}
                  </div>
                  <p className="text-sm text-muted-foreground">Collected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
