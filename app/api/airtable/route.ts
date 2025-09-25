// app/api/airtable/route.ts

import Airtable from "airtable"
import { NextResponse } from "next/server"

// ✅ Helper: add CORS headers to all responses
function withCORS(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*", // 🔒 for prod: your Framer domain
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
}

// ✅ Handle preflight requests
export async function OPTIONS() {
  return withCORS({}, 200)
}

export async function GET() {
  try {
    const apiKey = process.env.AIRTABLE_API_KEY
    const baseId = process.env.AIRTABLE_BASE_ID
    const tableId = process.env.AIRTABLE_TABLE_ID

    if (!apiKey) return withCORS({ error: "AIRTABLE_API_KEY not set" }, 500)
    if (!baseId) return withCORS({ error: "AIRTABLE_BASE_ID not set" }, 500)
    if (!tableId) return withCORS({ error: "AIRTABLE_TABLE_ID not set" }, 500)

    // Configure Airtable
    Airtable.configure({
      apiKey: apiKey,
      endpointUrl: "https://api.airtable.com",
    })

    const base = Airtable.base(baseId)
    const table = base(tableId)

    // Fetch records
    const records = await table
      .select({
        // optional filters
        // filterByFormula: "NOT({Status} = 'Completed')",
      })
      .firstPage()

    const data = records.map((record) => ({
      id: record.id,
      fields: record.fields,
      createdTime: record.get("Created"),
    }))

    return withCORS({
      success: true,
      records: data,
      count: data.length,
    })
  } catch (err: any) {
    console.error("Airtable API error:", err)

    if (err.statusCode === 401) return withCORS({ error: "Unauthorized" }, 401)
    if (err.statusCode === 403) return withCORS({ error: "Forbidden" }, 403)
    if (err.statusCode === 404) return withCORS({ error: "Not Found" }, 404)

    return withCORS(
      { error: "Failed to fetch Airtable data", details: err.message },
      500
    )
  }
}
