import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { HubSpotDeal } from "@/types/database";
import { ContractAlerts } from "./contract-alerts";
import { ContractsTable } from "./contracts-table";

export const dynamic = "force-dynamic";
export const revalidate = 0;
import { ContractFilters } from "./contracts-filters";

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const country = typeof params.country === "string" ? params.country : undefined;
  const category = typeof params.category === "string" ? params.category : undefined;
  const retailer = typeof params.retailer === "string" ? params.retailer : undefined;
  const status = typeof params.status === "string" ? params.status : undefined;
  const q = typeof params.q === "string" ? params.q.trim() : undefined;

  const supabase = createServerSupabaseClient();
  let query = supabase.from("contracts").select("*").order("end_date", { nullsFirst: false });

  if (country) query = query.eq("country", country);
  if (category) query = query.eq("category_code", category);
  if (retailer) query = query.eq("retailer_simple", retailer);
  const today = new Date().toISOString().slice(0, 10);
  if (status === "active") query = query.or(`end_date.gte.${today},end_date.is.null`);
  if (status === "expired") query = query.lt("end_date", today);
  if (q) {
    query = query.or(`deal_id.ilike.%${q}%,retailer_simple.ilike.%${q}%,retailer.ilike.%${q}%`);
  }

  const { data: contracts } = await query;

  const { data: hubspotDeals } = await supabase.from("hubspot_deals").select("*");
  const hubspot = new Map(
    (hubspotDeals ?? []).map((d) => [d.hs_deal_id, d as HubSpotDeal])
  );

  const { data: allDealIdRows } = await supabase.from("contracts").select("deal_id");
  const dealIdSet = new Set((allDealIdRows ?? []).map((r) => r.deal_id));
  const hubspotNotInMapping = (hubspotDeals ?? []).filter(
    (d) => !dealIdSet.has(d.hs_deal_id) && d.fa_arr_type !== "Syndicated"
  ) as HubSpotDeal[];

  const { data: allForDupes } = await supabase
    .from("contracts")
    .select("deal_id, category_code, retailer_simple");
  const key = (r: { deal_id: string; category_code: string | null; retailer_simple: string | null }) =>
    `${r.deal_id}|${r.category_code ?? ""}|${r.retailer_simple ?? ""}`;
  const countByKey = new Map<string, number>();
  for (const r of allForDupes ?? []) {
    const k = key(r);
    countByKey.set(k, (countByKey.get(k) ?? 0) + 1);
  }
  const duplicateGroups = (allForDupes ?? [])
    .filter((r) => (countByKey.get(key(r)) ?? 0) > 1)
    .map((r) => ({
      deal_id: r.deal_id,
      category_code: r.category_code ?? null,
      retailer_simple: r.retailer_simple ?? null,
      count: countByKey.get(key(r)) ?? 0,
    }));
  const seenKeys = new Set<string>();
  const duplicateGroupsDeduped = duplicateGroups.filter((r) => {
    const k = key(r);
    if (seenKeys.has(k)) return false;
    seenKeys.add(k);
    return true;
  });

  const { data: distinct } = await supabase
    .from("contracts")
    .select("country, category_code, retailer_simple")
    .limit(5000);

  const countries = Array.from(new Set((distinct ?? []).map((r) => r.country).filter(Boolean))).sort();
  const categories = Array.from(new Set((distinct ?? []).map((r) => r.category_code).filter(Boolean))).sort();
  const retailers = Array.from(new Set((distinct ?? []).map((r) => r.retailer_simple).filter(Boolean))).sort();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Contracts</h1>
        <p className="text-muted-foreground">
          Filter by country, category, retailer, and status. Click a row for details.
        </p>
      </div>

      <ContractFilters
        country={country}
        category={category}
        retailer={retailer}
        status={status}
        q={q}
        countries={countries}
        categories={categories}
        retailers={retailers}
      />

      <ContractAlerts
        hubspotNotInMapping={hubspotNotInMapping}
        duplicateGroups={duplicateGroupsDeduped}
      />

      <ContractsTable contracts={contracts ?? []} hubspot={hubspot} />
    </div>
  );
}
