import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import process from "process";

// Load .env.local (simple parser)
try {
  const envPath = ".env.local";
  if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, "utf8");
    raw.split(/\r?\n/).forEach((line) => {
      const l = line.trim();
      if (!l || l.startsWith("#")) return;
      const idx = l.indexOf("=");
      if (idx === -1) return;
      const key = l.substring(0, idx).trim();
      let val = l.substring(idx + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = val;
    });
  }
} catch {
  // ignore
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/NEXT_PUBLIC_SUPABASE_ANON_KEY in environment"
  );
  process.exit(1);
}

const supabase = createClient(url, key);

async function run() {
  try {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .limit(50);
    if (error) {
      console.error("Supabase error:", error.message || error);
      process.exit(1);
    }
    console.log("Found customers rows:", Array.isArray(data) ? data.length : 0);
    console.dir(data, { depth: 2 });
  } catch (err) {
    console.error("Unexpected error:", err);
    process.exit(1);
  }
}

run();
