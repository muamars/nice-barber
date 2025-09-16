import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";
import { pushRowsToSheet, getSheetData } from "@/lib/googleSheets";

type GroupedAppointment = {
  date: string;
  time: string;
  customer: { name: string; whatsapp: string } | null;
  treatments: string[]; // Array of treatment names
  capster: { name: string } | null;
};

// Function to group appointments by customer, time, and capster (same as frontend)
function groupAppointments(
  rawAppointments: Record<string, unknown>[]
): GroupedAppointment[] {
  const grouped: { [key: string]: GroupedAppointment } = {};

  rawAppointments.forEach((appointment) => {
    // Create a unique key for grouping (customer_name + time + capster_name)
    const customers = appointment.customers as {
      name: string;
      whatsapp: string;
    } | null;
    const treatments = appointment.treatments as { name: string } | null;
    const capsters = appointment.capsters as { name: string } | null;

    const customerName = customers?.name || "";
    const capsterName = capsters?.name || "";
    const groupKey = `${customerName}_${appointment.time}_${capsterName}`;

    if (grouped[groupKey]) {
      // Add treatment to existing group
      if (treatments?.name) {
        grouped[groupKey].treatments.push(treatments.name);
      }
    } else {
      // Create new group
      grouped[groupKey] = {
        date: appointment.date as string,
        time: appointment.time as string,
        customer: customers,
        treatments: treatments?.name ? [treatments.name] : [],
        capster: capsters,
      };
    }
  });

  return Object.values(grouped);
}

export async function POST() {
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

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    if (!appointments || appointments.length === 0) {
      return NextResponse.json({
        message: "Tidak ada appointment hari ini untuk di-export",
        exported: [],
      });
    }

    // Check if Google Sheets is configured
    if (
      !process.env.GOOGLE_SERVICE_ACCOUNT_KEY ||
      !process.env.GOOGLE_SHEET_ID
    ) {
      return NextResponse.json({
        message: "Google Sheets not configured",
        data: appointments,
      });
    }

    // Group appointments like in the frontend
    const groupedAppointments = groupAppointments(appointments);

    // Helper function to normalize WhatsApp number
    const normalizeWhatsApp = (whatsapp: string): string => {
      return whatsapp
        .replace(/^\+62/, "0") // Convert +62 to 0
        .replace(/^\+/, "") // Remove any other leading +
        .trim();
    };

    // Get existing data from Google Sheets to check for duplicates
    const existingData = await getSheetData();

    // Create a set of existing appointment identifiers for quick lookup
    // We'll use a combination of date, customer name, time, and capster as unique identifier
    // This matches our grouping logic
    const existingAppointments = new Set();
    existingData.forEach((row: string[]) => {
      if (
        row.length >= 6 &&
        row[0] !== "No" &&
        row[0] !== "" &&
        row[0] !== "Column 1"
      ) {
        // Skip header row and empty rows
        // Create identifier that matches our grouping: date-customer-time-capster
        const date = (row[1] || "").toString().trim();
        const customer = (row[2] || "").toString().trim();
        const whatsapp = normalizeWhatsApp((row[3] || "").toString());
        const capster = (row[5] || "").toString().trim();

        // Try to extract time from treatment if it was stored there, or use a composite key
        // Since we group by customer+time+capster, use customer+capster for checking
        const identifier = `${date}-${customer}-${whatsapp}-${capster}`;
        existingAppointments.add(identifier);
      }
    });

    // Filter out appointments that already exist in Google Sheets
    const newAppointments = groupedAppointments.filter((appointment) => {
      // Create identifier that matches our grouping logic
      const date = appointment.date.trim();
      const customer = (appointment.customer?.name || "").trim();
      const whatsapp = normalizeWhatsApp(appointment.customer?.whatsapp || "");
      const capster = (appointment.capster?.name || "").trim();
      const identifier = `${date}-${customer}-${whatsapp}-${capster}`;
      const isExisting = existingAppointments.has(identifier);

      // Log for debugging (will be removed later)
      if (process.env.NODE_ENV === "development") {
        console.log(`Checking appointment: ${identifier}`);
        console.log(`  - Exists in sheet: ${isExisting}`);
        if (isExisting) {
          console.log(`  - Found matching identifier in existing set`);
        }
      }

      return !isExisting;
    });

    // Create rows with proper formatting for new appointments only
    const newRows = newAppointments.map((appointment, index) => {
      // Calculate the row number based on existing data
      // Exclude header row from count if it exists
      const existingRowCount =
        existingData.length > 0 &&
        existingData[0] &&
        existingData[0][0] === "No"
          ? existingData.length - 1
          : existingData.length;
      const rowNumber = existingRowCount + index + 1;

      return [
        rowNumber, // No (continue from existing numbering)
        appointment.date,
        appointment.customer?.name || "",
        normalizeWhatsApp(appointment.customer?.whatsapp || ""), // Normalize WhatsApp when saving
        appointment.treatments.join(", "), // Gabung treatments seperti di website
        appointment.capster?.name || "",
      ];
    });

    // Prepare rows for export
    const rowsToExport = [];

    // Add header only if sheet is empty
    if (existingData.length === 0) {
      rowsToExport.push([
        "No",
        "Tanggal",
        "Customer",
        "Whatsapp",
        "Treatment",
        "Capster",
      ]);
    }

    // Add new rows
    if (newRows.length > 0) {
      rowsToExport.push(...newRows);
    }

    let exportResult = null;
    if (rowsToExport.length > 0) {
      exportResult = await pushRowsToSheet(rowsToExport);
    }

    const responseMessage =
      newRows.length === 0
        ? "Semua appointment hari ini sudah di-export sebelumnya"
        : `${newRows.length} appointment baru berhasil di-export ke Google Sheets`;

    // Log export summary for debugging
    console.log(`Export Summary:
    - Date: ${date}
    - Total appointments: ${groupedAppointments.length}
    - New exports: ${newRows.length}
    - Existing in sheet: ${
      existingData.length > 0 && existingData[0] && existingData[0][0] === "No"
        ? existingData.length - 1
        : existingData.length
    }
    `);

    return NextResponse.json({
      exported: newAppointments,
      message: responseMessage,
      totalAppointments: groupedAppointments.length,
      newExports: newRows.length,
      existingInSheet:
        existingData.length > 0 &&
        existingData[0] &&
        existingData[0][0] === "No"
          ? existingData.length - 1
          : existingData.length,
      date: date,
      exportResult,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Export error:", err);
    return NextResponse.json(
      {
        error: "Failed to export to Google Sheets",
        details: message,
      },
      { status: 500 }
    );
  }
}
