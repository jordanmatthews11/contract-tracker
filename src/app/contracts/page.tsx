import { createServerSupabaseClient } from "@/lib/supabase-server";
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

      <ContractsTable contracts={contracts ?? []} />
    </div>
  );
}
