import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({ 
    message: "PDF extract-text route is working",
    status: "ok"
  })
}

export async function POST(request: Request) {
  try {
    console.log("PDF extract-text route called")
    
    // Check content type first
    const contentType = request.headers.get("content-type")
    console.log("Content-Type:", contentType)
    
    if (!contentType || (!contentType.includes("multipart/form-data") && !contentType.includes("application/x-www-form-urlencoded"))) {
      return NextResponse.json({ 
        message: "Invalid content type. Expected multipart/form-data or application/x-www-form-urlencoded",
        received: contentType,
        status: 400 
      }, { status: 400 })
    }
    
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ message: "No file uploaded." }, { status: 400 })
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ message: "Please upload a PDF file." }, { status: 400 })
    }

    // Dynamically import pdf-parse to avoid build issues
    const pdf = (await import("pdf-parse")).default

    // Extract text from PDF
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const data = await pdf(fileBuffer)

    // Return the extracted text with metadata
    return NextResponse.json({ 
      text: data.text,
      pages: data.numpages,
      info: data.info,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        extractedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error("Error extracting text from PDF:", error)
    return NextResponse.json(
      { message: "Internal Server Error: Failed to extract text from PDF." },
      { status: 500 },
    )
  }
}
