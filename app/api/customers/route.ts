import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { toCamel } from "snake-camel"
import type { Customer } from "@/lib/types"

/**
 * API route to fetch all customers.
 * Fetches data from the PostgreSQL database.
 */
export async function GET() {
  try {
    const client = await pool.connect()
    try {
      const result = await client.query("SELECT * FROM customers ORDER BY created_at DESC")

      // The 'pg' library returns column names in snake_case.
      // We convert them to camelCase to match our TypeScript types.
      const customersFromDb = result.rows.map((row) => toCamel(row))

      // Transform the flat database structure into the nested structure expected by the frontend.
      const formattedCustomers: Customer[] = customersFromDb.map((c: any) => ({
        id: c.id.toString(), // Convert SERIAL id to string
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone,
        dateOfBirth: c.dateOfBirth,
        address: {
          street: c.addressStreet || "N/A",
          city: c.addressCity || "N/A",
          state: c.addressState || "N/A",
          zipCode: c.addressZipCode || "N/A",
        },
        insuranceInfo: {
          policyNumber: c.policyNumber,
          policyType: c.policyType,
          premium: Number.parseFloat(c.premium) || 0,
          status: "active", // Default status since it's not in the schema
          startDate: "N/A",
          endDate: "N/A",
        },
        communicationPreferences: {
          email: c.commPrefsEmail,
          sms: c.commPrefsSms,
          phone: c.commPrefsPhone,
          preferredTime: c.preferredTime,
        },
        notes: c.notes,
      }))

      return NextResponse.json(formattedCustomers)
    } finally {
      // Ensure the client is released back to the pool
      client.release()
    }
  } catch (error) {
    console.error("Failed to fetch customers:", error)
    return NextResponse.json(
      { message: "Internal Server Error: Failed to fetch customers." },
      { status: 500 },
    )
  }
}
