"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Cloud,
  Search,
  Upload,
  ArrowLeft,
  Download,
  Share,
  Trash2,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  ImageIcon,
  File,
  BarChart3,
  Loader2,
} from "lucide-react"
import { formatFileSize, calculateStorageStats } from "@/lib/storage-utils"
import type { StorageFile, StorageStats } from "@/lib/storage-utils"
import type { Customer } from "@/lib/types"

export default function StoragePage() {
  const [files, setFiles] = useState<StorageFile[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        setError(null)
        const [filesResponse, customersResponse] = await Promise.all([
          fetch("/api/storage/files"),
          fetch("/api/customers"),
        ])

        if (!filesResponse.ok) {
          throw new Error("Failed to fetch files from storage.")
        }
        // Customer data is optional for display, so we can fail more gracefully
        if (!customersResponse.ok) {
          console.error("Failed to fetch customers.")
        }

        const filesData = await filesResponse.json()
        const customersData = customersResponse.ok ? await customersResponse.json() : []

        setFiles(filesData)
        setCustomers(customersData)
      } catch (e) {
        setError(e instanceof Error ? e.message : "An unknown error occurred.")
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const stats: StorageStats = calculateStorageStats(files)

  const filteredFiles = files.filter((file) => {
    const matchesSearch =
      file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesCategory = filterCategory === "all" || file.category === filterCategory
    const matchesStatus = filterStatus === "all" || file.syncStatus === filterStatus

    return matchesSearch && matchesCategory && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "synced":
        return "bg-green-100 text-green-800 border-green-200"
      case "syncing":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "failed":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "synced":
        return <CheckCircle className="h-4 w-4" />
      case "syncing":
        return <RefreshCw className="h-4 w-4 animate-spin" />
      case "pending":
        return <Clock className="h-4 w-4" />
      case "failed":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
      case "document":
        return <FileText className="h-5 w-5 text-red-500" />
      case "image":
        return <ImageIcon className="h-5 w-5 text-blue-500" />
      case "spreadsheet":
        return <BarChart3 className="h-5 w-5 text-green-500" />
      default:
        return <File className="h-5 w-5 text-gray-500" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "policy":
        return "bg-blue-100 text-blue-800"
      case "claim":
        return "bg-red-100 text-red-800"
      case "payment":
        return "bg-green-100 text-green-800"
      case "identification":
        return "bg-purple-100 text-purple-800"
      case "communication":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const retrySync = (fileId: string) => {
    setFiles((prev) => prev.map((file) => (file.id === fileId ? { ...file, syncStatus: "syncing" as const } : file)))

    // Simulate retry
    setTimeout(() => {
      setFiles((prev) => prev.map((file) => (file.id === fileId ? { ...file, syncStatus: "synced" as const } : file)))
    }, 2000)
  }

  const handleDownload = async (fileKey: string, fileName: string) => {
    setDownloadingFileId(fileKey)
    try {
      const response = await fetch("/api/storage/download-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: fileKey }),
      })

      if (!response.ok) {
        throw new Error("Failed to get download link.")
      }

      const { downloadUrl } = await response.json()

      // Trigger the download
      const link = document.createElement("a")
      link.href = downloadUrl
      link.setAttribute("download", fileName)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error("Download failed:", err)
      // Here you could show a toast notification for the error
    } finally {
      setDownloadingFileId(null)
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
                <Cloud className="h-6 w-6 text-accent" />
                <h1 className="text-2xl font-bold text-foreground">Cloud Storage</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Link href="/storage/upload">
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Storage Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Cloud className="h-5 w-5 text-accent" />
                <div>
                  <div className="text-2xl font-bold text-foreground">{stats.totalFiles}</div>
                  <p className="text-sm text-muted-foreground">Total Files</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-foreground">{stats.syncedFiles}</div>
                  <p className="text-sm text-muted-foreground">Synced</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <div className="text-2xl font-bold text-foreground">{stats.pendingSync}</div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <div className="text-2xl font-bold text-foreground">{stats.failedSync}</div>
                  <p className="text-sm text-muted-foreground">Failed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Storage Usage */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Storage Usage</CardTitle>
            <CardDescription>
              {formatFileSize(stats.usedStorage)} of {formatFileSize(stats.availableStorage)} used
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={(stats.usedStorage / stats.availableStorage) * 100} className="w-full" />
            <div className="flex justify-between text-sm text-muted-foreground mt-2">
              <span>{formatFileSize(stats.usedStorage)} used</span>
              <span>{formatFileSize(stats.availableStorage - stats.usedStorage)} available</span>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All Files</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="synced">Synced</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="failed">Failed</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search files by name or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterCategory === "all" ? "default" : "outline"}
                  onClick={() => setFilterCategory("all")}
                  size="sm"
                >
                  All
                </Button>
                <Button
                  variant={filterCategory === "policy" ? "default" : "outline"}
                  onClick={() => setFilterCategory("policy")}
                  size="sm"
                >
                  Policies
                </Button>
                <Button
                  variant={filterCategory === "claim" ? "default" : "outline"}
                  onClick={() => setFilterCategory("claim")}
                  size="sm"
                >
                  Claims
                </Button>
                <Button
                  variant={filterCategory === "communication" ? "default" : "outline"}
                  onClick={() => setFilterCategory("communication")}
                  size="sm"
                >
                  Communications
                </Button>
              </div>
            </div>

            {/* Files List */}
            <div className="space-y-3">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground">Loading Files...</h3>
                  <p className="text-muted-foreground">Fetching your documents from the cloud.</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center text-center py-12 text-red-600">
                  <AlertCircle className="h-8 w-8 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Failed to load files</h3>
                  <p className="text-sm">{error}</p>
                </div>
              ) : filteredFiles.length === 0 && !isLoading ? (
                <div className="text-center py-12">
                  <Cloud className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No files found</h3>
                  <p className="text-muted-foreground">Upload your first file to get started.</p>
                </div>
              ) : (
                filteredFiles.map((file) => {
                const customer = file.customerId ? customers.find((c) => c.id === file.customerId) : null
                return (
                  <Card key={file.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="flex-shrink-0">{getFileIcon(file.type)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-medium text-foreground truncate">{file.name}</h3>
                              <Badge className={getCategoryColor(file.category)} variant="secondary">
                                {file.category}
                              </Badge>
                              <Badge className={getStatusColor(file.syncStatus)}>
                                <div className="flex items-center space-x-1">
                                  {getStatusIcon(file.syncStatus)}
                                  <span>{file.syncStatus}</span>
                                </div>
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span>{formatFileSize(file.size)}</span>
                              <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                              {customer && (
                                <span>
                                  {customer.firstName} {customer.lastName}
                                </span>
                              )}
                            </div>
                            {file.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {file.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="px-2 py-1 bg-muted text-xs rounded-md text-muted-foreground"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          {file.syncStatus === "failed" && (
                            <Button variant="outline" size="sm" onClick={() => retrySync(file.id)}>
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(file.key, file.name)}
                            disabled={downloadingFileId === file.key}
                          >
                            {downloadingFileId === file.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Share className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
              )}
            </div >
          </TabsContent>

          {/* Other tab contents with filtered data */}
          <TabsContent value="recent">
            <div className="space-y-3">
              {files
                .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
                .slice(0, 10)
                .map((file) => (
                  <Card key={file.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        {getFileIcon(file.type)}
                        <div className="flex-1">
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={getStatusColor(file.syncStatus)}>
                          {getStatusIcon(file.syncStatus)}
                          <span className="ml-1">{file.syncStatus}</span>
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="synced">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {files
                .filter((file) => file.syncStatus === "synced")
                .map((file) => (
                  <Card key={file.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3 mb-2">
                        {getFileIcon(file.type)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{file.name}</p>
                          <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(file.syncStatus)} variant="secondary">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Synced
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="pending">
            <div className="space-y-3">
              {files
                .filter((file) => file.syncStatus === "pending" || file.syncStatus === "syncing")
                .map((file) => (
                  <Card key={file.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getFileIcon(file.type)}
                          <div>
                            <p className="font-medium">{file.name}</p>
                            <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(file.syncStatus)}>
                            {getStatusIcon(file.syncStatus)}
                            <span className="ml-1">{file.syncStatus}</span>
                          </Badge>
                          {file.syncStatus === "syncing" && <Progress value={65} className="w-20" />}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="failed">
            <div className="space-y-3">
              {files
                .filter((file) => file.syncStatus === "failed")
                .map((file) => (
                  <Card key={file.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getFileIcon(file.type)}
                          <div>
                            <p className="font-medium">{file.name}</p>
                            <p className="text-sm text-muted-foreground">{formatFileSize(file.size)} • Sync failed</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(file.syncStatus)}>
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Failed
                          </Badge>
                          <Button variant="outline" size="sm" onClick={() => retrySync(file.id)}>
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Retry
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
