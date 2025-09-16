(async () => {
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error(
      "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars"
    );
    process.exit(1);
  }

  const supabase = createClient(url, key);

  try {
    const treatments = [
      { name: "Haircut" },
      { name: "Shave" },
      { name: "Haircut + Shave" },
    ];

    const capsters = [{ name: "Budi" }, { name: "Siti" }, { name: "Andi" }];

    await supabase
      .from("treatments")
      .upsert(treatments, { onConflict: ["name"] });
    await supabase.from("capsters").upsert(capsters, { onConflict: ["name"] });

    await supabase
      .from("customers")
      .upsert([{ name: "John Doe", whatsapp: "+628123456789" }], {
        onConflict: ["whatsapp"],
      });

    console.log("Seed completed");
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
