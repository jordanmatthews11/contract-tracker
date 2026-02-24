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

    const toUpsert = rows
      .filter((r) => r.deal_id && r.retailer_simple)
      .map((r) => ({
        deal_id: r.deal_id,
        retailer_simple: r.retailer_simple,
        start_date: r.start_date || null,
        end_date: r.end_date || null,
        category_code: r.category_code || null,
        country: r.country || null,
        suggested_store_list: r.suggested_store_list || null,
        retailer: r.retailer || null,
        monthly_quota: r.monthly_quota ?? null,
        notes: r.notes || null,
        months_of_collection: r.months_of_collection ?? null,
      }));

    const { error } = await supabase.from("contracts").upsert(toUpsert, {
      onConflict: "deal_id,retailer_simple",
    });

    if (error) {
      console.error("Import error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      imported: toUpsert.length,
      skipped: rows.length - toUpsert.length,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Import failed" },
      { status: 500 }
    );
  }
}
