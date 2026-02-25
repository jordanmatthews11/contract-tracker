import { NextResponse } from "next/server";
import { createHash } from "crypto";
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
  trueDuplicateCount: number;
  trueDuplicateExamples: string[];
  blankFieldRows: { row: number; fields: string[] }[];
  verifiedCount?: number;
};

const BATCH_SIZE = 500;

function makeRowHash(fields: (string | number | null)[]): string {
  return createHash("md5")
    .update(fields.map((v) => (v == null ? "" : String(v))).join("|"))
    .digest("hex");
}

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

    const blankFieldRows: { row: number; fields: string[] }[] = [];
    const trueDuplicateHashes = new Set<string>();
    const trueDuplicateExamples: string[] = [];

    const mapped = rows.map((r, idx) => {
      const rowNum = idx + 2;
      const dealId = normId(r.deal_id) || `_BLANK_ROW_${rowNum}`;
      const retailerSimple = r.retailer_simple ? String(r.retailer_simple).trim() : "";
      const startDate = r.start_date || null;
      const endDate = r.end_date || null;
      const categoryCode = r.category_code || null;
      const country = r.country || null;
      const storeList = r.suggested_store_list || null;
      const retailer = r.retailer || null;
      const quota = safeInt(r.monthly_quota);
      const notes = r.notes || null;
      const months = safeInt(r.months_of_collection);

      const missingFields: string[] = [];
      if (!normId(r.deal_id)) missingFields.push("deal_id");
      if (!retailerSimple) missingFields.push("retailer_simple");
      if (!country) missingFields.push("country");
      if (quota == null) missingFields.push("monthly_quota");
      if (!startDate) missingFields.push("start_date");
      if (!endDate) missingFields.push("end_date");
      if (missingFields.length > 0) blankFieldRows.push({ row: rowNum, fields: missingFields });

      const hash = makeRowHash([
        dealId, retailerSimple, startDate, endDate,
        categoryCode, country, storeList, retailer, quota, notes, months,
      ]);

      return {
        deal_id: dealId,
        retailer_simple: retailerSimple,
        start_date: startDate,
        end_date: endDate,
        category_code: categoryCode,
        country,
        suggested_store_list: storeList,
        retailer,
        monthly_quota: quota,
        notes,
        months_of_collection: months,
        row_hash: hash,
      };
    });

    // Deduplicate within the batch by row_hash (true exact-match duplicates only)
    const seenHashes = new Map<string, number>();
    const toInsert: (typeof mapped)[0][] = [];
    for (const row of mapped) {
      const prev = seenHashes.get(row.row_hash);
      if (prev !== undefined) {
        if (trueDuplicateExamples.length < 50) {
          trueDuplicateExamples.push(`${row.deal_id} | ${row.retailer_simple}`);
        }
        trueDuplicateHashes.add(row.row_hash);
      } else {
        seenHashes.set(row.row_hash, 1);
        toInsert.push(row);
      }
    }

    const supabase = createServerSupabaseClient();
    for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
      const batch = toInsert.slice(i, i + BATCH_SIZE);
      const { error } = await supabase
        .from("contracts")
        .upsert(batch, { onConflict: "row_hash", ignoreDuplicates: true });
      if (error) {
        console.error("Import error at batch", i, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    const { count, error: countError } = await supabase
      .from("contracts")
      .select("id", { count: "exact", head: true });

    if (countError) {
      console.error("Verification read failed", countError);
      return NextResponse.json(
        { error: `Import wrote data but verification failed: ${countError.message}. Check schema and Supabase project.` },
        { status: 500 }
      );
    }

    if (toInsert.length > 0 && (count ?? 0) === 0) {
      return NextResponse.json(
        {
          error:
            "Import reported success but no rows found in database. Check that migration 002 is applied (contracts table has id and row_hash) and that you are using the same Supabase project for import and for viewing Contracts.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      imported: toInsert.length,
      totalRows: rows.length,
      trueDuplicateCount: trueDuplicateHashes.size,
      trueDuplicateExamples,
      blankFieldRows: blankFieldRows.slice(0, 200),
      verifiedCount: count ?? undefined,
    } satisfies ImportResult);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Import failed" },
      { status: 500 }
    );
  }
}
