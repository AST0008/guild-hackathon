import { NextResponse } from "next/server"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const s3Client = new S3Client({
  region: process.env.S3_REGION!,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
})

export async function POST(request: Request) {
  try {
    const { key } = await request.json()

    if (!key) {
      return NextResponse.json({ message: "File key is required" }, { status: 400 })
    }

    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
    })

    // Generate a presigned URL valid for 60 seconds
    const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 })

    return NextResponse.json({ downloadUrl })
  } catch (error) {
    console.error("Error creating presigned download URL:", error)
    return NextResponse.json(
      { message: "Internal Server Error: Failed to create download URL." },
      { status: 500 },
    )
  }
}

