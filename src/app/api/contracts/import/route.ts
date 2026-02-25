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

export type ImportResult = {
  imported: number;
  totalRows: number;
  duplicateCount: number;
  duplicateExamples: string[];
  blankFieldRows: { row: number; fields: string[] }[];
};

const BATCH_SIZE = 500;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { rows: ImportRow[] };
    const { rows } = body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No rows provided" }, { status: 400 });
    }

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

    const normId = (v: unknown): string => {
      if (v == null) return "";
      if (typeof v === "number") {
        if (!Number.isFinite(v)) return "";
        return Math.abs(v) >= 1e15 ? v.toFixed(0) : String(v);
      }
      const s = String(v).trim();
      if (/e/i.test(s)) {
        const n = parseFloat(s);
        if (Number.isFinite(n)) return Math.abs(n) >= 1e15 ? n.toFixed(0) : s;
      }
      return s;
    };

    // Track blank fields per row (row numbers are 1-indexed + header = +2)
    const blankFieldRows: { row: number; fields: string[] }[] = [];

    const mapped = rows.map((r, idx) => {
      const rowNum = idx + 2;
      const dealId = normId(r.deal_id) || `_BLANK_ROW_${rowNum}`;
      const retailerSimple = r.retailer_simple ? String(r.retailer_simple).trim() : "";

      const missingFields: string[] = [];
      if (!normId(r.deal_id)) missingFields.push("deal_id");
      if (!retailerSimple) missingFields.push("retailer_simple");
      if (!r.country) missingFields.push("country");
      if (r.monthly_quota == null) missingFields.push("monthly_quota");
      if (!r.start_date) missingFields.push("start_date");
      if (!r.end_date) missingFields.push("end_date");

      if (missingFields.length > 0) {
        blankFieldRows.push({ row: rowNum, fields: missingFields });
      }

      return {
        deal_id: dealId,
        retailer_simple: retailerSimple,
        start_date: r.start_date || null,
        end_date: r.end_date || null,
        category_code: r.category_code || null,
        country: r.country || null,
        suggested_store_list: r.suggested_store_list || null,
        retailer: r.retailer || null,
        monthly_quota: safeInt(r.monthly_quota),
        notes: r.notes || null,
        months_of_collection: safeInt(r.months_of_collection),
      };
    });

    // Deduplicate by (deal_id, retailer_simple) — last row wins.
    // Track which keys appeared more than once.
    const seenKeys = new Map<string, number>();
    const duplicateKeys = new Set<string>();
    for (const row of mapped) {
      const key = `${row.deal_id} | ${row.retailer_simple}`;
      if (seenKeys.has(key)) duplicateKeys.add(key);
      seenKeys.set(key, (seenKeys.get(key) ?? 0) + 1);
    }

    const dedupMap = new Map<string, (typeof mapped)[0]>();
    for (const row of mapped) {
      dedupMap.set(`${row.deal_id}|${row.retailer_simple}`, row);
    }
    const toUpsert = Array.from(dedupMap.values());

    const supabase = createServerSupabaseClient();
    for (let i = 0; i < toUpsert.length; i += BATCH_SIZE) {
      const batch = toUpsert.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from("contracts").upsert(batch, {
        onConflict: "deal_id,retailer_simple",
      });
      if (error) {
        console.error("Import error at batch", i, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      imported: toUpsert.length,
      totalRows: rows.length,
      duplicateCount: duplicateKeys.size,
      duplicateExamples: Array.from(duplicateKeys).slice(0, 50),
      blankFieldRows: blankFieldRows.slice(0, 200),
    } satisfies ImportResult);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Import failed" },
      { status: 500 }
    );
  }
}
