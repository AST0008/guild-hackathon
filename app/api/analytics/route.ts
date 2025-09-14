import { NextResponse } from "next/server"
import pool from "@/lib/db"

interface AnalyticsData {
  totalCustomers: number
  activeConversations: number
  totalRevenue: number
  conversionRate: number
  monthlyStats: {
    month: string
    customers: number
    revenue: number
    conversations: number
  }[]
  conversationMoods: {
    mood: string
    count: number
    percentage: number
  }[]
  topPolicies: {
    policyType: string
    count: number
    revenue: number
  }[]
}

export async function GET() {
  try {
    const client = await pool.connect()
    try {
      // Get total customers
      const customerResult = await client.query("SELECT COUNT(*) FROM customers")
      const totalCustomers = parseInt(customerResult.rows[0].count, 10)

      // Mock data for other metrics (in a real app, these would come from actual data)
      const activeConversations = Math.floor(Math.random() * 50) + 20 // 20-70 conversations
      const totalRevenue = Math.floor(Math.random() * 100000) + 50000 // $50k-$150k
      const conversionRate = Math.random() * 0.3 + 0.1 // 10-40%

      // Generate monthly stats for the last 6 months
      const monthlyStats = []
      for (let i = 5; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        monthlyStats.push({
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          customers: Math.floor(Math.random() * 20) + 10,
          revenue: Math.floor(Math.random() * 20000) + 10000,
          conversations: Math.floor(Math.random() * 30) + 15
        })
      }

      // Mock conversation mood data
      const conversationMoods = [
        { mood: "receptive", count: 45, percentage: 35 },
        { mood: "neutral", count: 38, percentage: 30 },
        { mood: "frustrated", count: 25, percentage: 20 },
        { mood: "confused", count: 20, percentage: 15 }
      ]

      // Mock top policies data
      const topPolicies = [
        { policyType: "Auto Insurance", count: 45, revenue: 54000 },
        { policyType: "Home Insurance", count: 32, revenue: 25600 },
        { policyType: "Life Insurance", count: 18, revenue: 43200 },
        { policyType: "Health Insurance", count: 12, revenue: 14400 }
      ]

      const analytics: AnalyticsData = {
        totalCustomers,
        activeConversations,
        totalRevenue,
        conversionRate,
        monthlyStats,
        conversationMoods,
        topPolicies
      }

      return NextResponse.json(analytics)
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json(
      { message: "Internal Server Error: Failed to fetch analytics." },
      { status: 500 }
    )
  }
}
