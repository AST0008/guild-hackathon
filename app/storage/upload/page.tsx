"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Upload, X, FileText, ImageIcon, File, BarChart3, CheckCircle } from "lucide-react"
import type { Customer } from "@/lib/types"
import { formatFileSize } from "@/lib/utils"

interface UploadingFile {
  file: File
  progress: number
  status: "uploading" | "completed" | "error"
  id: string
}

export default function UploadPage() {
  const router = useRouter()
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("other")
  const [selectedCustomer, setSelectedCustomer] = useState<string>("")
  const [dragActive, setDragActive] = useState(false)

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch("/api/customers")
        if (!response.ok) {
          // Silently fail or log error, as this is an optional field
          console.error("Failed to fetch customers for upload page")
          return
        }
        const data = await response.json()
        setCustomers(data)
      } catch (err) {
        console.error("Error fetching customers:", err)
      }
    }
    fetchCustomers()
  }, [])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files)
      setSelectedFiles((prev) => [...prev, ...files])
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setSelectedFiles((prev) => [...prev, ...files])
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const getFileIcon = (file: File) => {
    const type = file.type
    if (type.includes("image")) return <ImageIcon className="h-5 w-5 text-blue-500" />
    if (type.includes("pdf")) return <FileText className="h-5 w-5 text-red-500" />
    if (type.includes("spreadsheet") || type.includes("excel")) return <BarChart3 className="h-5 w-5 text-green-500" />
    return <File className="h-5 w-5 text-gray-500" />
  }

  const startUpload = async () => {
    const uploads: UploadingFile[] = selectedFiles.map((file) => ({
      file,
      progress: 0,
      status: "uploading" as const,
      id: `upload-${Date.now()}-${Math.random()}`,
    }))

    setUploadingFiles(uploads)
    setSelectedFiles([])

    for (const upload of uploads) {
      try {
        // 1. Get a presigned URL from our API
        const presignedUrlResponse = await fetch("/api/storage/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: upload.file.name,
            contentType: upload.file.type,
          }),
        })

        if (!presignedUrlResponse.ok) {
          throw new Error("Failed to get presigned URL.")
        }

        const { uploadUrl, key } = await presignedUrlResponse.json()

        // 2. Upload the file directly to S3
        const uploadResponse = await fetch(uploadUrl, {
          method: "PUT",
          body: upload.file,
          headers: { "Content-Type": upload.file.type },
        })

        if (!uploadResponse.ok) {
          throw new Error("S3 upload failed.")
        }

        // 3. Mark as completed
        setUploadingFiles((prev) =>
          prev.map((u) => (u.id === upload.id ? { ...u, status: "completed" as const, progress: 100 } : u)),
        )

        // TODO: Save the file metadata (key, customerId, category) to your database here
        console.log(`Upload successful! File key: ${key}`)
      } catch (error) {
        console.error("Upload failed for file:", upload.file.name, error)
        setUploadingFiles((prev) => prev.map((u) => (u.id === upload.id ? { ...u, status: "error" as const } : u)))
      }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/storage">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Storage
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <Upload className="h-6 w-6 text-accent" />
              <h1 className="text-2xl font-bold text-foreground">Upload Files</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Upload Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>File Category</CardTitle>
                <CardDescription>Categorize your files for better organization</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="policy">Policy Documents</SelectItem>
                    <SelectItem value="claim">Claim Files</SelectItem>
                    <SelectItem value="payment">Payment Records</SelectItem>
                    <SelectItem value="identification">Identification</SelectItem>
                    <SelectItem value="communication">Communications</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Associate with Customer</CardTitle>
                <CardDescription>Link files to a specific customer (optional)</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific customer</SelectItem>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.firstName} {customer.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>

          {/* File Upload Area */}
          <Card>
            <CardHeader>
              <CardTitle>Select Files</CardTitle>
              <CardDescription>Drag and drop files or click to browse</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Drop files here or click to browse</h3>
                <p className="text-muted-foreground mb-4">
                  Supports PDF, images, documents, and spreadsheets up to 10MB each
                </p>
                <Input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                />
                <Label htmlFor="file-upload">
                  <Button variant="outline" className="cursor-pointer bg-transparent">
                    Browse Files
                  </Button>
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Selected Files ({selectedFiles.length})</CardTitle>
                <CardDescription>Review files before uploading</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getFileIcon(file)}
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-muted-foreground">{formatFileSize(file.size) || null}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-6">
                  <Button onClick={startUpload} disabled={selectedFiles.length === 0}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload {selectedFiles.length} File{selectedFiles.length !== 1 ? "s" : ""}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upload Progress */}
          {uploadingFiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Upload Progress</CardTitle>
                <CardDescription>Files are being uploaded and synced to the cloud</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {uploadingFiles.map((upload) => (
                    <div key={upload.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getFileIcon(upload.file)}
                          <div>
                            <p className="font-medium">{upload.file.name}</p>
                            <p className="text-sm text-muted-foreground">{formatFileSize(upload.file.size) || null}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {upload.status === "completed" && <CheckCircle className="h-5 w-5 text-green-600" />}
                          <span className="text-sm text-muted-foreground">
                            {upload.status === "uploading" && `${upload.progress}%`}
                            {upload.status === "completed" && "Complete"}
                            {upload.status === "error" && "Error"}
                          </span>
                        </div>
                      </div>
                      <Progress value={upload.progress} className="w-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
