import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";

  const { data, error } = await supabase
    .from("customers")
    .select("id, name, whatsapp")
    .or(`name.ilike.%${q}%,whatsapp.ilike.%${q}%`)
    .limit(20);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  // expect { name, whatsapp }
  const { data, error } = await supabase
    .from("customers")
    .insert([{ name: body.name, whatsapp: body.whatsapp }])
    .select();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data?.[0]);
}
