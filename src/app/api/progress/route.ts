import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      deal_id,
      retailer_simple,
      month,
      responses_collected,
      updated_by,
    } = body as {
      deal_id: string;
      retailer_simple: string;
      month: string;
      responses_collected: number;
      updated_by?: string;
    };

    if (!deal_id || !retailer_simple || !month) {
      return NextResponse.json(
        { error: "Missing deal_id, retailer_simple, or month" },
        { status: 400 }
      );
    }

    const collected = Number(responses_collected);
    if (Number.isNaN(collected) || collected < 0) {
      return NextResponse.json(
        { error: "responses_collected must be a non-negative number" },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("progress_logs")
      .upsert(
        {
          deal_id,
          retailer_simple,
          month: month.slice(0, 7) + "-01",
          responses_collected: collected,
          updated_by: updated_by ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "deal_id,retailer_simple,month" }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Request failed" },
      { status: 500 }
    );
  }
}
