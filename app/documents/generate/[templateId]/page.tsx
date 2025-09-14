"use client"

import { useState, useEffect, useCallback } from "react"
import htmlToPdf from "html-pdf"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, FileText, User, Wand2, UploadCloud, Loader2, AlertTriangle } from "lucide-react"
import { documentTemplates, getCustomerDataValue } from "@/lib/document-templates"
import type { Customer } from "@/lib/types"
import { Checkbox } from "@/components/ui/checkbox"

export default function GenerateDocumentPage() {
  const params = useParams()
  const templateId = params.templateId as string

  const template = documentTemplates.find((t) => t.id === templateId)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [extractionError, setExtractionError] = useState<string | null>(null)

  // Fetch customers for the dropdown
  useEffect(() => {
    const fetchCustomers = async () => {
      const response = await fetch("/api/customers")
      if (response.ok) {
        const data = await response.json()
        setCustomers(data)
      }
    }
    fetchCustomers()
  }, [])

  useEffect(() => {
    if (selectedCustomer && template) {
      // Auto-fill form with customer data
      const autoFilledData: Record<string, any> = {}

      template.fields.forEach((field) => {
        if (field.customerDataPath) {
          const value = getCustomerDataValue(selectedCustomer, field.customerDataPath)
          if (value) {
            autoFilledData[field.id] = value
          }
        }
      })

      setFormData((prev) => ({ ...prev, ...autoFilledData }))
    }
  }, [selectedCustomer, template])

  const handleFileParse = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsExtracting(true)
    setExtractionError(null)
    setSelectedCustomer(null) // Clear any selected customer
    setFormData({}) // Clear existing form data

    const fileFormData = new FormData()
    fileFormData.append("file", file)
    console.log('file data', file);
    

    try {
      // const response = await fetch("/api/documents/extract-text", {
      const response = await fetch("/api/documents/extract-text/route", {
        method: "POST",
        body: fileFormData,
      })


      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to extract text.")
      }
      

      const { text } = await response.json()
      console.log('text', text);
      

      // This is a simple parsing logic. A more "intelligent" system
      // would use more advanced NLP or pattern matching.
      const extracted: Record<string, any> = {}
      const emailMatch = text.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i)
      if (emailMatch) extracted.customerEmail = emailMatch[0]

      const phoneMatch = text.match(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/)
      if (phoneMatch) extracted.customerPhone = phoneMatch[0]

      const policyMatch = text.match(/Policy Number:?\s*([A-Z0-9-]+)/i)
      if (policyMatch) extracted.policyNumber = policyMatch[1]

      // For debugging: Log the extracted data to the console
      console.log("Extracted data from PDF:", extracted)

      setFormData(extracted)
    } catch (error) {
      setExtractionError(error instanceof Error ? error.message : "An unknown error occurred.")
    } finally {
      setIsExtracting(false)
    }
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Template Not Found</h2>
          <p className="text-muted-foreground mb-4">The document template you're looking for doesn't exist.</p>
          <Link href="/documents">
            <Button>Back to Documents</Button>
          </Link>
        </div>
      </div>
    )
  }

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }))
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    setGenerationError(null)
  
    try {
      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${template.name}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 50px; }
                .field { margin-bottom: 10px; }
                .label { font-weight: bold; display: block; }
            </style>
        </head>
        <body>
            <h1>${template.name}</h1>
            <p>${template.description}</p>
            ${template.fields
              .map(
                (field) => `
                    <div class="field">
                        <span class="label">${field.label}:</span>
                        <span>${formData[field.id] || "N/A"}</span>
                    </div>
                `
              )
              .join('')}
        </body>
        </html>
      `
  
      const response = await fetch('/api/pdf/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: htmlContent }),
      })
  
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to generate PDF.')
      }
  
      const pdfBlob = await response.blob()
      const url = URL.createObjectURL(pdfBlob)
  
      const a = document.createElement('a')
      a.href = url
      a.download = `${template.name.replace(/\s+/g, '_').toLowerCase()}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
  
      console.log('Document generated successfully:', formData)
    } catch (error) {
      console.error('Error generating document:', error)
      setGenerationError(error instanceof Error ? error.message : 'An unexpected error occurred.')
    }
  
    setIsGenerating(false)
  }
  

  const typeColorMap: Record<string, string> = {
    policy: "bg-blue-100 text-blue-800 border-blue-200",
    claim: "bg-red-100 text-red-800 border-red-200",
    quote: "bg-green-100 text-green-800 border-green-200",
    renewal: "bg-yellow-100 text-yellow-800 border-yellow-200",
    certificate: "bg-purple-100 text-purple-800 border-purple-200",
  }

  const getTypeColor = (type: string): string => {
    return typeColorMap[type] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/documents">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Documents
                </Button>
              </Link>
              <div>
                <div className="flex items-center space-x-2">
                  <FileText className="h-6 w-6 text-accent" />
                  <h1 className="text-2xl font-bold text-foreground">{template.name}</h1>
                  <Badge className={getTypeColor(template.type) ?? ""}>{template.type}</Badge>
                </div>
                <p className="text-muted-foreground">{template.description}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Customer Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-accent" />
                <CardTitle>Select Customer</CardTitle>
              </div>
              <CardDescription>Choose a customer to auto-fill their information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <Select
                  onValueChange={(value) => {
                    const customer = customers.find((c) => c.id === value)
                    setSelectedCustomer(customer || null)
                  }}
                  disabled={isExtracting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.firstName} {customer.lastName} - {customer.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="text-center text-muted-foreground">or</div>

                <div className="md:col-span-2">
                  <Label
                    htmlFor="pdf-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80 transition-colors"
                  >
                    {isExtracting ? (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Loader2 className="w-8 h-8 mb-2 text-primary animate-spin" />
                        <p className="text-sm text-muted-foreground">Extracting text...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                        <p className="mb-1 text-sm text-muted-foreground">
                          <span className="font-semibold">Upload a PDF</span> to autofill
                        </p>
                        <p className="text-xs text-muted-foreground">Policy docs, emails, etc.</p>
                      </div>
                    )}
                    <Input id="pdf-upload" type="file" className="hidden" onChange={handleFileParse} accept=".pdf" />
                  </Label>
                  {extractionError && <p className="text-sm text-destructive mt-2">{extractionError}</p>}
                </div>

                {(selectedCustomer || Object.keys(formData).length > 0) && !isExtracting && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Wand2 className="h-4 w-4" />
                    <span>Customer data will be automatically filled in the form below</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Document Form */}
          <Card>
            <CardHeader>
              <CardTitle>Document Information</CardTitle>
              <CardDescription>Fill in the required information for the document</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {template.fields.map((field) => (
                  <div
                    key={field.id}
                    className={
                      field.type === "text" && field.label.toLowerCase().includes("address") ? "md:col-span-2" : ""
                    }
                  >
                    <Label htmlFor={field.id}>
                      {field.label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>

                    {field.type === "text" && (
                      <Input
                        id={field.id}
                        value={formData[field.id] || ""}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        required={field.required}
                        className="mt-1"
                      />
                    )}

                    {field.type === "number" && (
                      <Input
                        id={field.id}
                        type="number"
                        value={formData[field.id] || ""}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        required={field.required}
                        className="mt-1"
                      />
                    )}

                    {field.type === "date" && (
                      <Input
                        id={field.id}
                        type="date"
                        value={formData[field.id] || ""}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        required={field.required}
                        className="mt-1"
                      />
                    )}

                    {field.type === "select" && field.options && (
                      <Select onValueChange={(value) => handleInputChange(field.id, value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder={`Select ${field.label.toLowerCase()}...`} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {field.type === "checkbox" && (
                      <div className="flex items-center space-x-2 mt-1">
                        <Checkbox
                          id={field.id}
                          checked={formData[field.id] || false}
                          onCheckedChange={(checked) => handleInputChange(field.id, checked)}
                        />
                        <Label htmlFor={field.id} className="text-sm">
                          {field.label}
                        </Label>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
            {generationError && <p className="text-sm text-destructive mt-2 px-6">{generationError}</p>}
          </Card>

          {/* Generate Button */}
          <div className="flex justify-end space-x-4">
            <Link href="/documents">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? (
                <>Generating...</>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Generate Document
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
