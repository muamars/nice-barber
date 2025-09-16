import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "weekly"; // weekly or monthly

  try {
    const now = new Date();
    let startDate: Date;
    const endDate: Date = new Date(now);

    if (type === "weekly") {
      // Get start of current week (Monday)
      startDate = new Date(now);
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
      startDate.setDate(diff);
      startDate.setHours(0, 0, 0, 0);
    } else {
      // Get start of current month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    // Get appointments in date range
    const { data: appointments, error: appointmentsError } = await supabase
      .from("appointments")
      .select(
        `
        *,
        customer:customers(id, name, whatsapp),
        treatments(name),
        capsters(name)
      `
      )
      .gte("date", startDateStr)
      .lte("date", endDateStr)
      .order("date", { ascending: true });

    if (appointmentsError) {
      return NextResponse.json(
        { error: appointmentsError.message },
        { status: 500 }
      );
    }

    // Process summary data
    const summary = {
      period: type,
      startDate: startDateStr,
      endDate: endDateStr,
      totalAppointments: appointments?.length || 0,
      totalCustomers:
        new Set(appointments?.map((a) => a.customer_id)).size || 0,
      totalTreatments: appointments?.length || 0,
      dailyBreakdown: {} as Record<string, number>,
      popularTreatments: {} as Record<string, number>,
      popularCapsters: {} as Record<string, number>,
      revenue: 0, // We can add this later when pricing is implemented
    };

    // Daily breakdown
    appointments?.forEach((appointment) => {
      const date = appointment.date;
      summary.dailyBreakdown[date] = (summary.dailyBreakdown[date] || 0) + 1;
    });

    // Popular treatments
    appointments?.forEach((appointment) => {
      const treatmentName = appointment.treatments?.name;
      if (treatmentName) {
        summary.popularTreatments[treatmentName] =
          (summary.popularTreatments[treatmentName] || 0) + 1;
      }
    });

    // Popular capsters
    appointments?.forEach((appointment) => {
      const capsterName = appointment.capsters?.name;
      if (capsterName) {
        summary.popularCapsters[capsterName] =
          (summary.popularCapsters[capsterName] || 0) + 1;
      }
    });

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Summary API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
