import { Pool } from "pg"

// This ensures that there's only one pool instance in the application.
// In a serverless environment, this can be tricky. Vercel recommends
// storing the client in a global variable in development to avoid
// exhausting connections with hot-reloading.
// https://vercel.com/guides/nextjs-prisma-postgres

let pool: Pool

const isProduction = process.env.NODE_ENV === "production"

if (isProduction) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  })
} else {
  // In development, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithPg = global as typeof global & {
    _pgPool: Pool
  }

  if (!globalWithPg._pgPool) {
    globalWithPg._pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
    })
  }
  pool = globalWithPg._pgPool
}

export default pool
