import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { HubSpotDeal } from "@/types/database";

export type HubSpotImportRow = Omit<HubSpotDeal, "imported_at">;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { rows: HubSpotImportRow[] };
    const { rows } = body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No rows provided" }, { status: 400 });
    }

    const valid = rows.filter(
      (r): r is HubSpotImportRow => r && typeof r === "object" && typeof (r as { hs_deal_id?: unknown }).hs_deal_id === "string" && (r as { hs_deal_id: string }).hs_deal_id.trim() !== ""
    );
    if (valid.length === 0) {
      return NextResponse.json({ error: "No valid rows (hs_deal_id required)" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const ids = valid.map((r) => r.hs_deal_id);
    const { data: existing } = await supabase.from("hubspot_deals").select("hs_deal_id").in("hs_deal_id", ids);
    const existingSet = new Set((existing ?? []).map((r) => r.hs_deal_id));
    let updated = 0;
    let imported = 0;
    for (const r of valid) {
      if (existingSet.has(r.hs_deal_id)) updated++;
      else imported++;
    }

    const { error } = await supabase.from("hubspot_deals").upsert(valid, { onConflict: "hs_deal_id" });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ imported, updated });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Import failed" }, { status: 500 });
  }
}
