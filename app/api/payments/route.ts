import { NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"

interface PaymentQRRequest {
  customerId: number
  amount: number
  description: string
  dueDate: string
  paymentUrl?: string
  expiresAt?: string
}

interface PaymentQRData {
  id: string
  customerId: number
  customerName: string
  policyNumber: string
  amount: number
  description: string
  dueDate: string
  status: string
  paymentUrl: string | null
  expiresAt: string | null
  createdAt: string
  updatedAt: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get("customerId")
    const status = searchParams.get("status")

    const client = await pool.connect()
    try {
      let query = `
        SELECT p.*, 
               CONCAT(c.first_name, ' ', c.last_name) as customer_name,
               c.policy_number
        FROM payments p
        LEFT JOIN customers c ON p.customer_id = c.id
        WHERE 1=1
      `
      const params: any[] = []
      let paramCount = 0

      if (customerId) {
        paramCount++
        query += ` AND p.customer_id = $${paramCount}`
        params.push(parseInt(customerId))
      }

      if (status) {
        paramCount++
        query += ` AND p.status = $${paramCount}`
        params.push(status)
      }

      query += " ORDER BY p.created_at DESC"

      const result = await client.query(query, params)
      
      const payments: PaymentQRData[] = result.rows.map((row: any) => ({
        id: row.id,
        customerId: row.customer_id,
        customerName: row.customer_name || "Unknown Customer",
        policyNumber: row.policy_number || "N/A",
        amount: parseFloat(row.amount),
        description: row.description,
        dueDate: row.due_date,
        status: row.status,
        paymentUrl: row.payment_url,
        expiresAt: row.expires_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))

      return NextResponse.json({
        payments,
        total: payments.length
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error fetching payments:", error)
    return NextResponse.json(
      { message: "Internal Server Error: Failed to fetch payments." },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: PaymentQRRequest = await request.json()
    
    const { customerId, amount, dueDate, description, paymentUrl, expiresAt } = body

    // Validate required fields
    if (!customerId || !amount || !dueDate || !description) {
      return NextResponse.json(
        { message: "Missing required fields: customerId, amount, dueDate, description" },
        { status: 400 }
      )
    }

    const client = await pool.connect()
    try {
      // Generate payment URL if not provided
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      const finalPaymentUrl = paymentUrl || `${baseUrl}/payments/${Date.now()}`

      // Calculate expiration date (30 days from now) if not provided
      const finalExpiresAt = expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

      const result = await client.query(
        `INSERT INTO payments (customer_id, amount, description, due_date, status, payment_url, expires_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`,
        [customerId, amount, description, dueDate, "active", finalPaymentUrl, finalExpiresAt]
      )

      // Get customer info for the response
      const customerResult = await client.query(
        "SELECT CONCAT(first_name, ' ', last_name) as customer_name, policy_number FROM customers WHERE id = $1",
        [customerId]
      )
      const customer = customerResult.rows[0]

      const newPayment: PaymentQRData = {
        id: result.rows[0].id,
        customerId: result.rows[0].customer_id,
        customerName: customer?.customer_name || "Unknown Customer",
        policyNumber: customer?.policy_number || "N/A",
        amount: parseFloat(result.rows[0].amount),
        description: result.rows[0].description,
        dueDate: result.rows[0].due_date,
        status: result.rows[0].status,
        paymentUrl: result.rows[0].payment_url,
        expiresAt: result.rows[0].expires_at,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at
      }

      return NextResponse.json(newPayment, { status: 201 })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error creating payment:", error)
    return NextResponse.json(
      { message: "Internal Server Error: Failed to create payment." },
      { status: 500 }
    )
  }
}
