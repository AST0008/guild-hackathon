"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, QrCode, User, DollarSign, Settings, Loader2 } from "lucide-react"
import { generatePaymentData, formatCurrency } from "@/lib/qr-utils"
import type { Customer } from "@/lib/types"

export default function GenerateQRCodePage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

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

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId)
    if (customer) {
      setSelectedCustomer(customer)
      // Auto-fill common fields
      setAmount(customer.insuranceInfo.premium.toString())
      setDescription(`${customer.insuranceInfo.policyType} Premium Payment`)

      // Set due date to end of current month
      const now = new Date()
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      setDueDate(endOfMonth.toISOString().split("T")[0])
    }
  }

  const handleGenerate = async () => {
    if (!selectedCustomer || !amount || !description || !dueDate) return

    setIsGenerating(true)

    // Generate payment data
    const paymentData = generatePaymentData(
      selectedCustomer.id,
      `${selectedCustomer.firstName} ${selectedCustomer.lastName}`,
      selectedCustomer.insuranceInfo.policyNumber || "N/A",
      Number.parseFloat(amount),
      description,
      dueDate,
    )

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    console.log("Generated QR Code:", paymentData)

    // Redirect to the generated QR code page
    router.push(`/payments/${paymentData.id}`)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/payments">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Payments
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <QrCode className="h-6 w-6 text-accent" />
              <h1 className="text-2xl font-bold text-foreground">Generate Payment QR Code</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Customer Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-accent" />
                <CardTitle>Select Customer</CardTitle>
              </div>
              <CardDescription>Choose the customer who will make the payment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customer">Customer</Label>
                  <Select onValueChange={handleCustomerSelect} disabled={isLoadingCustomers || !!error}>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={isLoadingCustomers ? "Loading customers..." : "Select a customer..."}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingCustomers ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : error ? (
                        <div className="p-2 text-sm text-red-600">{error}</div>
                      ) : (
                        customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.firstName} {customer.lastName} - {customer.insuranceInfo.policyType}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {selectedCustomer && (
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Customer Details</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Email:</span>
                        <p>{selectedCustomer.email}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Phone:</span>
                        <p>{selectedCustomer.phone}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Policy:</span>
                        <p>{selectedCustomer.insuranceInfo.policyNumber || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Type:</span>
                        <p>{selectedCustomer.insuranceInfo.policyType}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-accent" />
                <CardTitle>Payment Details</CardTitle>
              </div>
              <CardDescription>Configure the payment information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Payment Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
                {amount && (
                  <p className="text-sm text-muted-foreground">
                    Amount: {formatCurrency(Number.parseFloat(amount) || 0)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Payment Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Auto Insurance Premium Payment"
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
              </div>
            </CardContent>
          </Card>

          {/* QR Code Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-accent" />
                <CardTitle>QR Code Settings</CardTitle>
              </div>
              <CardDescription>Customize the appearance and behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiryDays">Expires After (days)</Label>
                  <Select defaultValue="30">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size">QR Code Size</Label>
                  <Select defaultValue="256">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="128">Small (128px)</SelectItem>
                      <SelectItem value="256">Medium (256px)</SelectItem>
                      <SelectItem value="512">Large (512px)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Features Included</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Secure payment link with encryption</li>
                  <li>• Automatic expiration after due date</li>
                  <li>• Real-time payment status updates</li>
                  <li>• Mobile-optimized payment page</li>
                  <li>• Email confirmation upon payment</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Generate Button */}
          <div className="flex justify-end space-x-4">
            <Link href="/payments">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button
              onClick={handleGenerate}
              disabled={!selectedCustomer || !amount || !description || !dueDate || isGenerating}
            >
              {isGenerating ? (
                <>Generating...</>
              ) : (
                <>
                  <QrCode className="h-4 w-4 mr-2" />
                  Generate QR Code
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
