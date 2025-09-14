"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  QrCode,
  Download,
  Share,
  Copy,
  Mail,
  MessageCircle,
  Calendar,
  DollarSign,
  User,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react"
import { generateQRCodeDataURL, formatCurrency, isQRCodeExpired } from "@/lib/qr-utils"

// Payment data is now fetched from the database via API

export default function PaymentQRDetailPage() {
  const params = useParams()
  const paymentId = params.id as string
  const [copied, setCopied] = useState(false)
  const [payment, setPayment] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        const response = await fetch("/api/payments")
        if (response.ok) {
          const payments = await response.json()
          const foundPayment = payments.find((p: any) => p.id === paymentId)
          setPayment(foundPayment)
        }
      } catch (error) {
        console.error("Error fetching payment:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPayment()
  }, [paymentId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-muted-foreground">Loading payment data ...</div>
        </div>
      </div>
    )
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Payment QR Code Not Found</h2>
          <p className="text-muted-foreground mb-4">The payment QR code you're looking for doesn't exist.</p>
          <Link href="/payments">
            <Button>Back to Payments</Button>
          </Link>
        </div>
      </div>
    )
  }

  const qrCodeDataURL = generateQRCodeDataURL(payment.paymentUrl)
  const isExpired = isQRCodeExpired(payment.expiresAt)

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
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadQRCode = () => {
    const link = document.createElement("a")
    link.download = `payment-qr-${payment.id}.svg`
    link.href = qrCodeDataURL
    link.click()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/payments">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Payments
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Payment QR Code</h1>
                <p className="text-muted-foreground">{payment.customerName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(payment.status)}>
                <div className="flex items-center space-x-1">
                  {getStatusIcon(payment.status)}
                  <span>{payment.status}</span>
                </div>
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* QR Code Display */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>QR Code</CardTitle>
                <CardDescription>Scan this code or share the payment link with your customer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* QR Code */}
                <div className="flex justify-center">
                  <div className="p-6 bg-white rounded-lg border-2 border-border">
                    <img src={qrCodeDataURL || "/placeholder.svg"} alt="Payment QR Code" className="w-64 h-64" />
                  </div>
                </div>

                {/* Status Warning */}
                {isExpired && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2 text-red-800">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-medium">This QR code has expired</span>
                    </div>
                    <p className="text-sm text-red-700 mt-1">
                      Generate a new QR code to accept payments from this customer.
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <Button onClick={downloadQRCode} variant="outline" className="bg-transparent">
                    <Download className="h-4 w-4 mr-2" />
                    Download QR Code
                  </Button>
                  <Button
                    onClick={() => copyToClipboard(payment.paymentUrl)}
                    variant="outline"
                    className="bg-transparent"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {copied ? "Copied!" : "Copy Link"}
                  </Button>
                  <Button variant="outline" className="bg-transparent">
                    <Share className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button variant="outline" className="bg-transparent">
                    <Mail className="h-4 w-4 mr-2" />
                    Email to Customer
                  </Button>
                  <Button variant="outline" className="bg-transparent">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Send SMS
                  </Button>
                </div>

                {/* Payment URL */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Payment URL</Label>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 p-2 bg-muted rounded text-sm font-mono break-all">
                      {payment.paymentUrl}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(payment.paymentUrl)}
                      className="bg-transparent"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Details Sidebar */}
          <div className="space-y-6">
            {/* Payment Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-accent" />
                  <CardTitle>Payment Details</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Amount:</span>
                    <span className="font-semibold text-lg">{formatCurrency(payment.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Due Date:</span>
                    <span className="text-sm">{new Date(payment.dueDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Expires:</span>
                    <span className="text-sm">{new Date(payment.expiresAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Created:</span>
                    <span className="text-sm">{new Date(payment.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <Separator />
                <div>
                  <span className="text-sm text-muted-foreground">Description:</span>
                  <p className="text-sm mt-1">{payment.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-accent" />
                  <CardTitle>Customer Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">Name:</span>
                  <p className="font-medium">{payment.customerName}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Policy Number:</span>
                  <p className="font-mono text-sm">{payment.policyNumber}</p>
                </div>
                <div className="pt-2">
                  <Link href={`/customers/${payment.customerId}`}>
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
                      View Customer Profile
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {payment.status === "active" && (
                  <Button variant="outline" className="w-full bg-transparent">
                    Mark as Paid
                  </Button>
                )}
                {(isExpired) && (
                  <Button className="w-full">
                    <QrCode className="h-4 w-4 mr-2" />
                    Generate New QR Code
                  </Button>
                )}
                <Button variant="outline" className="w-full bg-transparent">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Reminder
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>
}
