"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { FileText, Search, Plus, ArrowLeft, Download, Eye } from "lucide-react"
import { documentTemplates } from "@/lib/document-templates"

export default function DocumentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")

  const filteredTemplates = documentTemplates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = filterType === "all" || template.type === filterType

    return matchesSearch && matchesType
  })

  const getTypeColor = (type: string) => {
    switch (type) {
      case "policy":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "claim":
        return "bg-red-100 text-red-800 border-red-200"
      case "quote":
        return "bg-green-100 text-green-800 border-green-200"
      case "renewal":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "certificate":
        return "bg-purple-100 text-purple-800 border-purple-200"
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
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <FileText className="h-6 w-6 text-accent" />
                <h1 className="text-2xl font-bold text-foreground">Document Autofill</h1>
              </div>
            </div>
            <Link href="/documents/custom">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Custom Template
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search document templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterType === "all" ? "default" : "outline"}
              onClick={() => setFilterType("all")}
              size="sm"
            >
              All
            </Button>
            <Button
              variant={filterType === "policy" ? "default" : "outline"}
              onClick={() => setFilterType("policy")}
              size="sm"
            >
              Policies
            </Button>
            <Button
              variant={filterType === "claim" ? "default" : "outline"}
              onClick={() => setFilterType("claim")}
              size="sm"
            >
              Claims
            </Button>
            <Button
              variant={filterType === "quote" ? "default" : "outline"}
              onClick={() => setFilterType("quote")}
              size="sm"
            >
              Quotes
            </Button>
          </div>
        </div>

        {/* Document Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="text-sm mt-1">{template.description}</CardDescription>
                  </div>
                  <Badge className={getTypeColor(template.type)}>{template.type}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">{template.fields.length} fields • Auto-fill enabled</div>
                <div className="flex gap-2">
                  <Link href={`/documents/generate/${template.id}`} className="flex-1">
                    <Button size="sm" className="w-full">
                      <FileText className="h-4 w-4 mr-2" />
                      Generate
                    </Button>
                  </Link>
                  <Link href={`/documents/preview/${template.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No templates found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filterType !== "all"
                ? "Try adjusting your search or filter criteria."
                : "Get started by creating your first document template."}
            </p>
          </div>
        )}

        {/* Recent Documents */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-foreground mb-6">Recent Documents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Auto Policy - Maria Rodriguez</p>
                    <p className="text-sm text-muted-foreground">Generated 2 hours ago</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Home Policy - James Chen</p>
                    <p className="text-sm text-muted-foreground">Generated yesterday</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Claim Form - Sarah Johnson</p>
                    <p className="text-sm text-muted-foreground">Generated 3 days ago</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
