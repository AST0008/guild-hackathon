import { NextResponse } from "next/server"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { randomUUID } from "crypto"

// Initialize the S3 client
const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function POST(request: Request) {
  try {
    const { filename, contentType } = await request.json()

    if (!filename || !contentType) {
      return NextResponse.json({ message: "Filename and contentType are required" }, { status: 400 })
    }

    // Create a unique key for the S3 object to prevent overwrites
    const key = `uploads/${randomUUID()}-${filename}`

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: key,
      ContentType: contentType,
    })

    // Generate the presigned URL which is valid for 60 seconds
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 })

    return NextResponse.json({ uploadUrl, key })
  } catch (error) {
    console.error("Error creating presigned URL:", error)
    return NextResponse.json({ message: "Internal Server Error: Failed to create presigned URL." }, { status: 500 })
  }
}



