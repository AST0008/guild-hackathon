export interface StorageFile {
  id: string
  name: string
  key: string
  type: "document" | "image" | "pdf" | "spreadsheet" | "other"
  size: number
  url: string
  customerId?: string
  category: "policy" | "claim" | "payment" | "identification" | "communication" | "other"
  uploadedAt: string
  lastModified: string
  syncStatus: "synced" | "syncing" | "failed" | "pending"
  tags: string[]
}

export interface StorageStats {
  totalFiles: number
  totalSize: number
  usedStorage: number
  availableStorage: number
  syncedFiles: number
  pendingSync: number
  failedSync: number
}

export const mockStorageFiles: StorageFile[] = [
  {
    id: "file-001",
    name: "Maria_Rodriguez_Auto_Policy.pdf",
    type: "pdf",
    key:'2',
    size: 2048576, // 2MB
    url: "/documents/maria-rodriguez-auto-policy.pdf",
    customerId: "1",
    category: "policy",
    uploadedAt: "2024-01-01T10:00:00Z",
    lastModified: "2024-01-01T10:00:00Z",
    syncStatus: "synced",
    tags: ["auto", "policy", "2024"],
  },
  {
    id: "file-002",
    key:'2',
    name: "James_Chen_Home_Insurance_Documents.pdf",
    type: "pdf",
    size: 1536000, // 1.5MB
    url: "/documents/james-chen-home-insurance.pdf",
    customerId: "2",
    category: "policy",
    uploadedAt: "2024-02-01T09:30:00Z",
    lastModified: "2024-02-01T09:30:00Z",
    syncStatus: "synced",
    tags: ["home", "policy", "2024"],
  },
  {
    id: "file-003",
    key:'2',
    name: "Customer_Database_Backup.xlsx",
    type: "spreadsheet",
    size: 512000, // 512KB
    url: "/backups/customer-database-backup.xlsx",
    category: "other",
    uploadedAt: "2024-03-01T00:00:00Z",
    lastModified: "2024-03-01T00:00:00Z",
    syncStatus: "syncing",
    tags: ["backup", "database", "customers"],
  },
  {
    id: "file-004",
    name: "Sarah_Johnson_ID_Copy.jpg",
    key:'2',
    type: "image",
    size: 1024000, // 1MB
    url: "/documents/sarah-johnson-id.jpg",
    customerId: "3",
    category: "identification",
    uploadedAt: "2024-03-01T11:00:00Z",
    lastModified: "2024-03-01T11:00:00Z",
    syncStatus: "failed",
    tags: ["identification", "sarah", "johnson"],
  },
  {
    id: "file-005",
    name: "Communication_Templates.docx",
    type: "document",
    key:'2',
    size: 256000, // 256KB
    url: "/templates/communication-templates.docx",
    category: "communication",
    uploadedAt: "2024-02-15T14:30:00Z",
    lastModified: "2024-02-20T16:45:00Z",
    syncStatus: "synced",
    tags: ["templates", "communication", "email"],
  },
]

export function formatFileSize(bytes: number): string {
  const sizes = ["Bytes", "KB", "MB", "GB"]
  if (bytes === 0) return "0 Bytes"
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i]
}

export function getFileIcon(type: string): string {
  switch (type) {
    case "pdf":
      return "📄"
    case "image":
      return "🖼️"
    case "document":
      return "📝"
    case "spreadsheet":
      return "📊"
    default:
      return "📁"
  }
}

export function calculateStorageStats(files: StorageFile[]): StorageStats {
  const totalFiles = files.length
  const totalSize = files.reduce((sum, file) => sum + file.size, 0)
  const usedStorage = totalSize
  const availableStorage = 10 * 1024 * 1024 * 1024 // 10GB limit
  const syncedFiles = files.filter((f) => f.syncStatus === "synced").length
  const pendingSync = files.filter((f) => f.syncStatus === "pending" || f.syncStatus === "syncing").length
  const failedSync = files.filter((f) => f.syncStatus === "failed").length

  return {
    totalFiles,
    totalSize,
    usedStorage,
    availableStorage,
    syncedFiles,
    pendingSync,
    failedSync,
  }
}

export async function uploadFile(file: File, category: string, customerId?: string): Promise<StorageFile> {
  // Simulate file upload
  await new Promise((resolve) => setTimeout(resolve, 2000))

  const storageFile: StorageFile = {
    id: `file-${Date.now()}`,
    name: file.name,
    key: `uploads/${file.name}`,
    type: getFileType(file.name),
    size: file.size,
    url: `/uploads/${file.name}`,
    customerId,
    category: category as any,
    uploadedAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    syncStatus: "pending",
    tags: [],
  }

  return storageFile
}

function getFileType(filename: string): StorageFile["type"] {
  const extension = filename.split(".").pop()?.toLowerCase()
  switch (extension) {
    case "pdf":
      return "pdf"
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
      return "image"
    case "doc":
    case "docx":
      return "document"
    case "xls":
    case "xlsx":
      return "spreadsheet"
    default:
      return "other"
  }
}
