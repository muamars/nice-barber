import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";
import { getSheetData } from "@/lib/googleSheets";

export async function GET() {
  try {
    const admin = supabaseAdmin();
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const date = `${yyyy}-${mm}-${dd}`;

    // Get all appointments for today
    const { data: appointments, error } = await admin
      .from("appointments")
      .select(
        "id, date, time, customers(name, whatsapp), treatments(name), capsters(name)"
      )
      .eq("date", date)
      .order("time", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Check if Google Sheets is configured
    let existingData = [];
    let sheetsConfigured = false;

    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY && process.env.GOOGLE_SHEET_ID) {
      sheetsConfigured = true;
      try {
        existingData = await getSheetData();
      } catch (err) {
        console.error("Error getting sheet data:", err);
      }
    }

    // Simple summary
    const summary = {
      date: date,
      appointmentsInDB: appointments?.length || 0,
      appointmentsInSheet:
        existingData.length > 0 &&
        existingData[0] &&
        existingData[0][0] === "No"
          ? existingData.length - 1
          : existingData.length,
      sheetsConfigured: sheetsConfigured,
      recentAppointments:
        appointments?.slice(0, 3).map((apt) => ({
          time: apt.time,
          customer: Array.isArray(apt.customers)
            ? apt.customers[0]?.name
            : (apt.customers as { name: string } | null)?.name,
          treatment: Array.isArray(apt.treatments)
            ? apt.treatments[0]?.name
            : (apt.treatments as { name: string } | null)?.name,
        })) || [],
      recentSheetEntries: existingData.slice(-3).map((row: string[]) => ({
        date: row[1],
        customer: row[2],
        whatsapp: row[3],
        treatment: row[4],
      })),
    };

    return NextResponse.json(summary);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Summary error:", err);
    return NextResponse.json(
      {
        error: "Failed to get summary",
        details: message,
      },
      { status: 500 }
    );
  }
}
