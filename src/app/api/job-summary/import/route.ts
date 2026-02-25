import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { JobSummaryExportRow } from "@/types/database";

export type JobSummaryImportRow = Omit<JobSummaryExportRow, "id" | "imported_at">;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { rows: JobSummaryImportRow[] };
    const { rows } = body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No rows provided" }, { status: 400 });
    }

    const valid = rows.filter(
      (r): r is JobSummaryImportRow =>
        r && typeof r === "object" && (r as { job_id?: unknown }).job_id !== undefined
    );

    const supabase = createServerSupabaseClient();
    const { error } = await supabase.from("job_summary_export").insert(valid);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ imported: valid.length });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Import failed" }, { status: 500 });
  }
}
