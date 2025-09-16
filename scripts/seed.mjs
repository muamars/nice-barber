import { createClient } from "@supabase/supabase-js";
import process from "process";
import fs from "fs";

// Load .env.local if present (simple parser, no deps)
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
      if (!(key in process.env)) {
        process.env[key] = val;
      }
    });
  }
} catch {
  // ignore
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars"
  );
  process.exit(1);
}

const supabase = createClient(url, key);

async function run() {
  const treatments = [
    { name: "Haircut" },
    { name: "Shave" },
    { name: "Haircut + Shave" },
  ];

  const capsters = [{ name: "Budi" }, { name: "Siti" }, { name: "Andi" }];

  await supabase
    .from("treatments")
    .upsert(treatments, { onConflict: ["name"] });

  // check result
  const { data: tdata, error: terr } = await supabase
    .from("treatments")
    .select("id, name")
    .limit(100);

  if (terr) {
    console.error(
      "Error upserting/selecting treatments:",
      terr.message || terr
    );
    process.exit(1);
  }

  const { data: cdata, error: cerr } = await supabase
    .from("capsters")
    .upsert(capsters, { onConflict: ["name"] })
    .select("id, name");

  if (cerr) {
    console.error("Error upserting capsters:", cerr.message || cerr);
    process.exit(1);
  }

  const { data: customersData, error: custErr } = await supabase
    .from("customers")
    .upsert([{ name: "John Doe", whatsapp: "+628123456789" }], {
      onConflict: ["whatsapp"],
    })
    .select("id, name, whatsapp");

  if (custErr) {
    console.error("Error upserting customers:", custErr.message || custErr);
    process.exit(1);
  }

  console.log("Seed completed");
  console.log("Treatments rows:", Array.isArray(tdata) ? tdata.length : 0);
  console.log(
    "Capsters rows (after upsert):",
    Array.isArray(cdata) ? cdata.length : 0
  );
  console.log(
    "Customers rows (after upsert):",
    Array.isArray(customersData) ? customersData.length : 0
  );
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
