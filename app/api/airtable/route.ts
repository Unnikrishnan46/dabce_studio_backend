// app/api/airtable/route.ts

import Airtable from "airtable";
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Check if environment variables are set
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const tableId = process.env.AIRTABLE_TABLE_ID;

    if (!apiKey) {
      return NextResponse.json(
        { error: "AIRTABLE_API_KEY environment variable is not set" },
        { status: 500 }
      );
    }

    if (!baseId) {
      return NextResponse.json(
        { error: "AIRTABLE_BASE_ID environment variable is not set" },
        { status: 500 }
      );
    }

    if (!tableId) {
      return NextResponse.json(
        { error: "AIRTABLE_TABLE_ID environment variable is not set" },
        { status: 500 }
      );
    }

    // Configure Airtable
    Airtable.configure({ 
      apiKey: apiKey,
      endpointUrl: 'https://api.airtable.com'
    });

    const base = Airtable.base(baseId);
    const table = base(tableId);

    // Fetch records using Airtable library
    const records = await table.select({
      // You can add filters here if needed
      // filterByFormula: "NOT({Status} = 'Completed')",
      // sort: [{field: "Created", direction: "desc"}]
    }).firstPage();

    // Transform records to a cleaner format
    const data = records.map(record => ({
      id: record.id,
      fields: record.fields,
      createdTime: record.get('Created')
    }));

    console.log(`Successfully fetched ${data.length} records from Airtable`);
    
    return NextResponse.json({ 
      success: true,
      records: data,
      count: data.length 
    });

  } catch (err: any) {
    console.error("Airtable API error:", err);
    
    // Provide more specific error messages
    if (err.statusCode === 401) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid API key" },
        { status: 401 }
      );
    } else if (err.statusCode === 403) {
      return NextResponse.json(
        { error: "Forbidden: API key doesn't have permission to access this base/table" },
        { status: 403 }
      );
    } else if (err.statusCode === 404) {
      return NextResponse.json(
        { error: "Not Found: Base or table doesn't exist" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to fetch Airtable data", details: err.message },
      { status: 500 }
    );
  }
}
