import { createServerSupabaseClient } from "@/lib/supabase-server";
import { ReportsView } from "./reports-view";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const country = typeof params.country === "string" ? params.country : undefined;
  const category = typeof params.category === "string" ? params.category : undefined;
  const retailer = typeof params.retailer === "string" ? params.retailer : undefined;
  const startDate = typeof params.start === "string" ? params.start : undefined;
  const endDate = typeof params.end === "string" ? params.end : undefined;

  const supabase = createServerSupabaseClient();
  let query = supabase.from("contracts").select("*").order("deal_id");

  if (country) query = query.eq("country", country);
  if (category) query = query.eq("category_code", category);
  if (retailer) query = query.eq("retailer_simple", retailer);
  if (startDate) query = query.gte("start_date", startDate);
  if (endDate) query = query.lte("end_date", endDate);

  const { data: contracts } = await query;

  const { data: distinct } = await supabase
    .from("contracts")
    .select("country, category_code, retailer_simple")
    .limit(5000);

  const countries = Array.from(new Set((distinct ?? []).map((r) => r.country).filter(Boolean))).sort();
  const categories = Array.from(new Set((distinct ?? []).map((r) => r.category_code).filter(Boolean))).sort();
  const retailers = Array.from(new Set((distinct ?? []).map((r) => r.retailer_simple).filter(Boolean))).sort();

  const list = contracts ?? [];
  const totalContracts = list.length;
  const quotas = list.map((c) => c.monthly_quota).filter((q): q is number => q != null && q > 0);
  const avgQuota =
    quotas.length > 0 ? Math.round(quotas.reduce((a, b) => a + b, 0) / quotas.length) : 0;

  return (
    <ReportsView
      contracts={list}
      totalContracts={totalContracts}
      avgQuota={avgQuota}
      country={country}
      category={category}
      retailer={retailer}
      startDate={startDate}
      endDate={endDate}
      countries={countries}
      categories={categories}
      retailers={retailers}
    />
  );
}
