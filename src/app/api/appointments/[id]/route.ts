import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

// GET single appointment by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = supabaseAdmin();

    const { data, error } = await supabase
      .from("appointments")
      .select(
        `
        id,
        date,
        time,
        customer:customers(id, name, whatsapp),
        treatments(id, name),
        capsters(id, name)
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching appointment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT update appointment by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { customer_id, treatment_id, capster_id } = body;

    console.log("PUT request data:", {
      id,
      customer_id,
      treatment_id,
      capster_id,
    });

    const supabase = supabaseAdmin();

    const { data, error } = await supabase
      .from("appointments")
      .update({
        customer_id: Number(customer_id),
        treatment_id: Number(treatment_id),
        capster_id: Number(capster_id),
      })
      .eq("id", id)
      .select(
        `
        id,
        date,
        time,
        customer:customers(id, name, whatsapp),
        treatments(id, name),
        capsters(id, name)
      `
      )
      .single();

    console.log("Supabase update result:", { data, error });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating appointment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE appointment by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = supabaseAdmin();

    const { error } = await supabase.from("appointments").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Appointment deleted successfully" });
  } catch (error) {
    console.error("Error deleting appointment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
