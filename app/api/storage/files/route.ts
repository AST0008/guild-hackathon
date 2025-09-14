import { NextResponse } from "next/server"
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3"
import type { StorageFile } from "@/lib/storage-utils"

const s3Client = new S3Client({
  region: process.env.S3_REGION!,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
})

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

export async function GET() {
  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.S3_BUCKET_NAME!,
      Prefix: "uploads/", // Assuming files are in an 'uploads' folder
    })

    const { Contents } = await s3Client.send(command)

    if (!Contents) {
      return NextResponse.json([])
    }

    const files: StorageFile[] = Contents.filter((file) => file.Size && file.Size > 0) // Filter out folder objects
      .map((file) => {
        const key = file.Key!
        const name = key.replace(/^uploads\/[a-f0-9-]+\-/, "") // Strip UUID prefix from filename
        const url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`

        return {
          id: file.ETag?.replace(/"/g, "") || key,
          name: name,
          type: getFileType(name),
          size: file.Size || 0,
          key:key,
          url: url,
          // These would ideally come from S3 object metadata, which we'll add in a later step.
          customerId: undefined,
          category: "other" as const ,
          uploadedAt: file.LastModified?.toISOString() || new Date().toISOString(),
          lastModified: file.LastModified?.toISOString() || new Date().toISOString(),
          syncStatus: "synced" as const,
          tags: [],
        }
      })
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())

    return NextResponse.json(files)
  } catch (error) {
    console.error("Failed to fetch files from S3:", error)
    return NextResponse.json({ message: "Internal Server Error: Failed to fetch files." }, { status: 500 })
  }
}
