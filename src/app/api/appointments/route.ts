import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date");

  // Use provided date or default to today
  let targetDate: Date;
  if (dateParam) {
    targetDate = new Date(dateParam);
  } else {
    targetDate = new Date();
  }

  const yyyy = targetDate.getFullYear();
  const mm = String(targetDate.getMonth() + 1).padStart(2, "0");
  const dd = String(targetDate.getDate()).padStart(2, "0");
  const date = `${yyyy}-${mm}-${dd}`;

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
    .order("time", { ascending: true });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  // expect { customer_id, treatment_id, capster_id }
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const date = `${yyyy}-${mm}-${dd}`;
  const time = now.toTimeString().split(" ")[0];

  const { data, error } = await supabase.from("appointments").insert([
    {
      date,
      time,
      customer_id: body.customer_id,
      treatment_id: body.treatment_id,
      capster_id: body.capster_id,
    },
  ]);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
