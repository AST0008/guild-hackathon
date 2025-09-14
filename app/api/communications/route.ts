import { NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"

interface CommunicationRequest {
  customerId: string
  type: "email" | "sms" | "phone" | "meeting"
  subject: string
  content: string
  scheduledFor?: string
}

interface CommunicationLog {
  id: string
  customerId: string
  type: "email" | "sms" | "phone" | "meeting"
  subject: string
  content: string
  scheduledFor?: string
  sentAt?: string
  status: "scheduled" | "sent" | "delivered" | "failed"
  createdAt: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get("customerId")
    const type = searchParams.get("type")
    const status = searchParams.get("status")

    const client = await pool.connect()
    try {
      // Join communications with communication_recipients to get customer info
      let query = `
        SELECT c.*, cr.customer_id, 
               CONCAT(cust.first_name, ' ', cust.last_name) as customer_name
        FROM communications c
        LEFT JOIN communication_recipients cr ON c.id = cr.communication_id
        LEFT JOIN customers cust ON cr.customer_id = cust.id
        WHERE 1=1
      `
      const params: any[] = []
      let paramCount = 0

      if (customerId) {
        paramCount++
        query += ` AND cr.customer_id = $${paramCount}`
        params.push(parseInt(customerId))
      }

      if (type) {
        paramCount++
        query += ` AND c.type = $${paramCount}`
        params.push(type)
      }

      if (status) {
        paramCount++
        query += ` AND c.status = $${paramCount}`
        params.push(status)
      }

      query += " ORDER BY c.created_at DESC"

      const result = await client.query(query, params)
      
      const communications: CommunicationLog[] = result.rows.map((row: any) => ({
        id: row.id.toString(),
        customerId: row.customer_id?.toString() || "",
        type: row.type,
        subject: row.subject,
        content: row.content,
        scheduledFor: row.scheduled_at,
        sentAt: row.sent_at,
        status: row.status,
        createdAt: row.created_at
      }))

      return NextResponse.json({
        communications,
        total: communications.length
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error fetching communications:", error)
    return NextResponse.json(
      { message: "Internal Server Error: Failed to fetch communications." },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CommunicationRequest = await request.json()
    
    const { customerId, type, subject, content, scheduledFor } = body

    // Validate required fields
    if (!customerId || !type || !subject || !content) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      )
    }

    const client = await pool.connect()
    try {
      // Start a transaction
      await client.query('BEGIN')

      // Insert into communications table
      const commResult = await client.query(
        `INSERT INTO communications (type, subject, content, status, scheduled_at, created_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
         RETURNING *`,
        [type, subject, content, scheduledFor ? "scheduled" : "sent", scheduledFor || null]
      )

      const communicationId = commResult.rows[0].id

      // Insert into communication_recipients table
      await client.query(
        `INSERT INTO communication_recipients (communication_id, customer_id)
         VALUES ($1, $2)`,
        [communicationId, parseInt(customerId)]
      )

      // Commit the transaction
      await client.query('COMMIT')

      const newCommunication: CommunicationLog = {
        id: commResult.rows[0].id.toString(),
        customerId: customerId,
        type: commResult.rows[0].type,
        subject: commResult.rows[0].subject,
        content: commResult.rows[0].content,
        scheduledFor: commResult.rows[0].scheduled_at,
        sentAt: commResult.rows[0].sent_at,
        status: commResult.rows[0].status,
        createdAt: commResult.rows[0].created_at
      }

      return NextResponse.json(newCommunication, { status: 201 })
    } catch (error) {
      // Rollback the transaction on error
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error creating communication:", error)
    return NextResponse.json(
      { message: "Internal Server Error: Failed to create communication." },
      { status: 500 }
    )
  }
}
