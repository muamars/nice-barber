import { NextResponse } from "next/server";
import { clearSheet } from "@/lib/googleSheets";

export async function DELETE() {
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

    // Clear the sheet for testing
    const result = await clearSheet();

    return NextResponse.json({
      message: "Google Sheet cleared successfully",
      result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Clear sheet error:", err);
    return NextResponse.json(
      {
        error: "Failed to clear Google Sheet",
        details: message,
      },
      { status: 500 }
    );
  }
}
