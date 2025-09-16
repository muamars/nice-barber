import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  const [{ data: treatments, error: e1 }, { data: capsters, error: e2 }] =
    await Promise.all([
      supabase.from("treatments").select("*").order("id"),
      supabase.from("capsters").select("*").order("id"),
    ]);

  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });
  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });

  console.log("Treatments loaded:", treatments?.length, treatments);
  console.log("Capsters loaded:", capsters?.length, capsters);

  return NextResponse.json({ treatments, capsters });
}
