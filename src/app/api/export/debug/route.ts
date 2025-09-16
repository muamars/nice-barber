import { NextResponse } from "next/server";
import { getSheetData } from "@/lib/googleSheets";

export async function GET() {
  try {
    // Check if Google Sheets is configured
    if (
      !process.env.GOOGLE_SERVICE_ACCOUNT_KEY ||
      !process.env.GOOGLE_SHEET_ID
    ) {
      return NextResponse.json(
        {
          error: "Google Sheets not configured",
        },
        { status: 400 }
      );
    }

    // Get existing data from Google Sheets
    const existingData = await getSheetData();

    return NextResponse.json({
      data: existingData,
      count: existingData.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Get sheet data error:", err);
    return NextResponse.json(
      {
        error: "Failed to get Google Sheet data",
        details: message,
      },
      { status: 500 }
    );
  }
}
