import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";
import { getSheetData } from "@/lib/googleSheets";

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

export async function GET() {
  try {
    const admin = supabaseAdmin();
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const date = `${yyyy}-${mm}-${dd}`;

    console.log("DEBUG: Checking date:", date);

    // Get all appointments for today
    const { data: appointments, error } = await admin
      .from("appointments")
      .select(
        "id, date, time, customers(name, whatsapp), treatments(name), capsters(name)"
      )
      .eq("date", date)
      .order("time", { ascending: true });

    if (error) {
      console.log("DEBUG: Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("DEBUG: Raw appointments from DB:", appointments);

    if (!appointments || appointments.length === 0) {
      return NextResponse.json({
        message: "Tidak ada appointment hari ini",
        date: date,
        rawAppointments: appointments,
      });
    }

    // Group appointments like in the frontend
    const groupedAppointments = groupAppointments(appointments);
    console.log("DEBUG: Grouped appointments:", groupedAppointments);

    // Helper function to normalize WhatsApp number
    const normalizeWhatsApp = (whatsapp: string): string => {
      return whatsapp
        .replace(/^\+62/, "0") // Convert +62 to 0
        .replace(/^\+/, "") // Remove any other leading +
        .trim();
    };

    // Check if Google Sheets is configured
    if (
      !process.env.GOOGLE_SERVICE_ACCOUNT_KEY ||
      !process.env.GOOGLE_SHEET_ID
    ) {
      return NextResponse.json({
        message: "Google Sheets not configured",
        date: date,
        rawAppointments: appointments,
        groupedAppointments: groupedAppointments,
        configuredSheets: false,
      });
    }

    // Get existing data from Google Sheets to check for duplicates
    const existingData = await getSheetData();
    console.log("DEBUG: Existing sheet data:", existingData);

    // Create a set of existing appointment identifiers for quick lookup
    const existingAppointments = new Set();
    const existingIdentifiers: string[] = [];

    existingData.forEach((row: string[]) => {
      if (
        row.length >= 4 &&
        row[0] !== "No" &&
        row[0] !== "" &&
        row[0] !== "Column 1"
      ) {
        // Skip header row and empty rows
        const date = (row[1] || "").toString().trim();
        const customer = (row[2] || "").toString().trim();
        const whatsapp = normalizeWhatsApp((row[3] || "").toString());
        const identifier = `${date}-${customer}-${whatsapp}`;
        existingAppointments.add(identifier);
        existingIdentifiers.push(identifier);
      }
    });

    console.log("DEBUG: Existing identifiers:", existingIdentifiers);

    // Check each appointment against existing data
    const appointmentChecks = groupedAppointments.map((appointment) => {
      const date = appointment.date.trim();
      const customer = (appointment.customer?.name || "").trim();
      const whatsapp = normalizeWhatsApp(appointment.customer?.whatsapp || "");
      const identifier = `${date}-${customer}-${whatsapp}`;
      const isExisting = existingAppointments.has(identifier);

      return {
        appointment,
        identifier,
        isExisting,
        date,
        customer,
        whatsapp,
      };
    });

    console.log("DEBUG: Appointment checks:", appointmentChecks);

    // Filter out appointments that already exist in Google Sheets
    const newAppointments = appointmentChecks
      .filter((check) => !check.isExisting)
      .map((check) => check.appointment);

    console.log("DEBUG: New appointments to export:", newAppointments);

    return NextResponse.json({
      date: date,
      rawAppointments: appointments,
      groupedAppointments: groupedAppointments,
      existingData: existingData,
      existingIdentifiers: existingIdentifiers,
      appointmentChecks: appointmentChecks,
      newAppointments: newAppointments,
      summary: {
        totalFromDB: appointments.length,
        groupedCount: groupedAppointments.length,
        existingInSheet: existingIdentifiers.length,
        newToExport: newAppointments.length,
      },
      configuredSheets: true,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Debug export error:", err);
    return NextResponse.json(
      {
        error: "Failed to debug export",
        details: message,
      },
      { status: 500 }
    );
  }
}
