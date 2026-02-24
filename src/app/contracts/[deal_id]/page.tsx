import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBlock } from "./progress-block";

function getCurrentMonthStart(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ deal_id: string }>;
}) {
  const { deal_id } = await params;
  const supabase = createServerSupabaseClient();

  const { data: contracts } = await supabase
    .from("contracts")
    .select("*")
    .eq("deal_id", deal_id)
    .order("retailer_simple");

  if (!contracts?.length) notFound();

  const { data: logs } = await supabase
    .from("progress_logs")
    .select("*")
    .eq("deal_id", deal_id)
    .order("month", { ascending: false });

  const first = contracts[0];
  const currentMonth = getCurrentMonthStart();
  const logsByKey = new Map<string, { responses_collected: number; updated_at: string }>();
  for (const log of logs ?? []) {
    const key = `${log.deal_id}|${log.retailer_simple}|${log.month}`;
    logsByKey.set(key, {
      responses_collected: log.responses_collected ?? 0,
      updated_at: log.updated_at ?? "",
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/contracts" className="text-sm text-muted-foreground hover:text-foreground">
          Contracts
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium">{deal_id}</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Deal {deal_id}</CardTitle>
          <CardDescription>
            {first.start_date && (
              <span>Start {first.start_date}</span>
            )}
            {first.end_date && (
              <span className="ml-2">End {first.end_date}</span>
            )}
            {first.category_code && (
              <Badge variant="secondary" className="ml-2">
                Category {first.category_code}
              </Badge>
            )}
            {first.country && (
              <Badge variant="outline" className="ml-2">
                {first.country}
              </Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {first.suggested_store_list && (
            <p className="text-sm text-muted-foreground">
              Suggested store list: {first.suggested_store_list}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Retailers &amp; monthly progress</h2>
        {contracts.map((c) => {
          const key = `${c.deal_id}|${c.retailer_simple}|${currentMonth}`;
          const current = logsByKey.get(key);
          const collected = current?.responses_collected ?? 0;
          const quota = c.monthly_quota ?? 0;
          const history = (logs ?? []).filter(
            (l) => l.deal_id === c.deal_id && l.retailer_simple === c.retailer_simple
          );

          return (
            <Card key={`${c.deal_id}-${c.retailer_simple}`}>
              <CardHeader>
                <CardTitle className="text-base">{c.retailer_simple ?? c.retailer}</CardTitle>
                <CardDescription>
                  Monthly quota: {quota} responses
                  {c.retailer !== c.retailer_simple && c.retailer && (
                    <span className="ml-2">({c.retailer})</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ProgressBlock
                  dealId={c.deal_id}
                  retailerSimple={c.retailer_simple ?? ""}
                  monthlyQuota={quota}
                  currentMonth={currentMonth}
                  collected={collected}
                  updatedAt={current?.updated_at}
                />
                {history.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">History</p>
                    <ul className="text-sm space-y-1">
                      {history.slice(0, 12).map((h) => (
                        <li key={h.id}>
                          {h.month}: {h.responses_collected} responses
                          {h.updated_at && (
                            <span className="text-muted-foreground ml-2">
                              {new Date(h.updated_at).toLocaleDateString()}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
