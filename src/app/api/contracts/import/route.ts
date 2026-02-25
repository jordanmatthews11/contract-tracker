import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export type ImportRow = {
  deal_id: string;
  start_date: string | null;
  end_date: string | null;
  category_code: string | null;
  country: string | null;
  suggested_store_list: string | null;
  retailer: string | null;
  retailer_simple: string | null;
  monthly_quota: number | null;
  notes: string | null;
  months_of_collection: number | null;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { rows: ImportRow[] };
    const { rows } = body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: "Missing or empty rows array" },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    const safeInt = (v: unknown): number | null => {
      if (v == null) return null;
      const str = String(v).trim();
      if (str === "" || /e/i.test(str)) return null;
      if (typeof v === "number") {
        if (!Number.isFinite(v) || v < 0 || v > 1_000_000) return null;
        return Math.floor(v);
      }
      const n = parseInt(str.replace(/[^0-9-]/g, ""), 10);
      if (Number.isNaN(n) || n < 0 || n > 1_000_000) return null;
      return n;
    };

    const normalizeDealId = (v: unknown): string => {
      if (v == null) return "";
      if (typeof v === "number") {
        if (!Number.isFinite(v)) return "";
        return Math.abs(v) >= 1e15 ? (v as number).toFixed(0) : String(v);
      }
      const s = String(v).trim();
      if (/e/i.test(s)) {
        const n = parseFloat(s);
        if (Number.isFinite(n)) return Math.abs(n) >= 1e15 ? n.toFixed(0) : s;
      }
      return s;
    };

    const mapped = rows
      .filter((r) => r.deal_id != null && r.deal_id !== "" && r.retailer_simple)
      .map((r) => ({
        deal_id: normalizeDealId(r.deal_id),
        retailer_simple: String(r.retailer_simple).trim(),
        start_date: r.start_date || null,
        end_date: r.end_date || null,
        category_code: r.category_code || null,
        country: r.country || null,
        suggested_store_list: r.suggested_store_list || null,
        retailer: r.retailer || null,
        monthly_quota: safeInt(r.monthly_quota),
        notes: r.notes || null,
        months_of_collection: safeInt(r.months_of_collection),
      }));

    const seen = new Map<string, (typeof mapped)[0]>();
    for (const row of mapped) {
      const key = `${row.deal_id}|${row.retailer_simple}`;
      seen.set(key, row);
    }
    const toUpsert = Array.from(seen.values());

    // Batch in groups of 500 to avoid hitting request size limits
    const BATCH_SIZE = 500;
    for (let i = 0; i < toUpsert.length; i += BATCH_SIZE) {
      const batch = toUpsert.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from("contracts").upsert(batch, {
        onConflict: "deal_id,retailer_simple",
      });
      if (error) {
        console.error("Import error at batch", i, error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      imported: toUpsert.length,
      skipped: rows.length - mapped.length,
      duplicatesRemoved: mapped.length - toUpsert.length,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Import failed" },
      { status: 500 }
    );
  }
}
