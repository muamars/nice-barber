import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // runtime will throw if not set when used
}

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "");

// server-side client using service role key for protected operations
export const supabaseAdmin = (serviceKey?: string) => {
  const key = serviceKey ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "", key);
};
