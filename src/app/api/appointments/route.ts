import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date");

  // Use provided date or default to today in Jakarta timezone
  let targetDate: Date;
  if (dateParam) {
    targetDate = new Date(dateParam);
  } else {
    // Get current date in Jakarta timezone
    targetDate = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
    );
  }

  const yyyy = targetDate.getFullYear();
  const mm = String(targetDate.getMonth() + 1).padStart(2, "0");
  const dd = String(targetDate.getDate()).padStart(2, "0");
  const date = `${yyyy}-${mm}-${dd}`;

  console.log("GET appointments for date:", date);

  const { data, error } = await supabase
    .from("appointments")
    .select(
      `
      *,
      customer:customers(id, name, whatsapp),
      treatments(name),
      capsters(name)
    `
    )
    .eq("date", date)
    .order("time", { ascending: false });

  console.log("GET appointments result:", { data: data?.length || 0, error });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  // expect { customer_id, treatment_id, capster_id }
  // Get current date and time in Jakarta timezone
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
  );
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const date = `${yyyy}-${mm}-${dd}`;
  const time = now.toTimeString().split(" ")[0];

  const { data, error } = await supabase
    .from("appointments")
    .insert([
      {
        date,
        time,
        customer_id: body.customer_id,
        treatment_id: body.treatment_id,
        capster_id: body.capster_id,
      },
    ])
    .select(
      `
      *,
      customer:customers(id, name, whatsapp),
      treatments(name),
      capsters(name)
    `
    );

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const body = await req.json();
  const { id, customer_id, treatment_id, capster_id, date, time } = body;

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("appointments")
    .update({
      customer_id,
      treatment_id,
      capster_id,
      date,
      time,
    })
    .eq("id", id)
    .select(
      `
      *,
      customer:customers(id, name, whatsapp),
      treatments(name),
      capsters(name)
    `
    );

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
