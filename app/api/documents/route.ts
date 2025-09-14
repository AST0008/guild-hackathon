import { NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"

interface DocumentRequest {
  customerId: number
  name: string
  type: "policy" | "claim" | "payment" | "identification" | "other"
  url: string
  description?: string
}

interface Document {
  id: string
  customerId: number
  name: string
  type: string
  url: string
  description: string | null
  uploadedAt: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get("customerId")
    const type = searchParams.get("type")

    const client = await pool.connect()
    try {
      let query = "SELECT * FROM documents WHERE 1=1"
      const params: any[] = []
      let paramCount = 0

      if (customerId) {
        paramCount++
        query += ` AND customer_id = $${paramCount}`
        params.push(parseInt(customerId))
      }

      if (type) {
        paramCount++
        query += ` AND type = $${paramCount}`
        params.push(type)
      }

      query += " ORDER BY uploaded_at DESC"

      const result = await client.query(query, params)
      
      const documents: Document[] = result.rows.map((row: any) => ({
        id: row.id.toString(),
        customerId: row.customer_id,
        name: row.name,
        type: row.type,
        url: row.url,
        description: row.description,
        uploadedAt: row.uploaded_at
      }))

      return NextResponse.json({
        documents,
        total: documents.length
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json(
      { message: "Internal Server Error: Failed to fetch documents." },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: DocumentRequest = await request.json()
    
    const { customerId, name, type, url, description } = body

    // Validate required fields
    if (!customerId || !name || !type || !url) {
      return NextResponse.json(
        { message: "Missing required fields: customerId, name, type, url" },
        { status: 400 }
      )
    }

    const client = await pool.connect()
    try {
      const result = await client.query(
        `INSERT INTO documents (customer_id, name, type, url, description, uploaded_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
         RETURNING *`,
        [customerId, name, type, url, description || null]
      )

      const newDocument: Document = {
        id: result.rows[0].id.toString(),
        customerId: result.rows[0].customer_id,
        name: result.rows[0].name,
        type: result.rows[0].type,
        url: result.rows[0].url,
        description: result.rows[0].description,
        uploadedAt: result.rows[0].uploaded_at
      }

      return NextResponse.json(newDocument, { status: 201 })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error creating document:", error)
    return NextResponse.json(
      { message: "Internal Server Error: Failed to create document." },
      { status: 500 }
    )
  }
}
