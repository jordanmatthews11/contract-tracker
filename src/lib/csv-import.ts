/**
 * Default column indices for Mapping File CSV (columns A–L; F skipped for our fields).
 * Headers in sheet: A=deal_id, B=start_d, C=end_da, D=simple_category_co, E=country,
 * G=Suggested Store List, H=Retailer, I=Retailer Simple, J=Monthly Quot, K=Notes, L=months of collection
 */
export const DEFAULT_COLUMN_INDICES: Record<string, number> = {
  deal_id: 0,
  start_date: 1,
  end_date: 2,
  category_code: 3,
  country: 4,
  suggested_store_list: 6,
  retailer: 7,
  retailer_simple: 8,
  monthly_quota: 9,
  notes: 10,
  months_of_collection: 11,
};

export type ColumnMapping = Record<string, number>;

export function parseDate(value: string | undefined): string | null {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

export function parseInteger(value: string | undefined): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value === "number") return Number.isInteger(value) ? value : Math.floor(value);
  const n = parseInt(String(value).replace(/[^0-9-]/g, ""), 10);
  return isNaN(n) ? null : n;
}

export function mapRow(
  row: string[],
  mapping: ColumnMapping
): {
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
} {
  const get = (key: string) => {
    const i = mapping[key];
    return i !== undefined && row[i] !== undefined ? String(row[i]).trim() : "";
  };
  return {
    deal_id: get("deal_id") || "",
    start_date: parseDate(get("start_date")),
    end_date: parseDate(get("end_date")),
    category_code: get("category_code") || null,
    country: get("country") || null,
    suggested_store_list: get("suggested_store_list") || null,
    retailer: get("retailer") || null,
    retailer_simple: get("retailer_simple") || null,
    monthly_quota: parseInteger(get("monthly_quota")),
    notes: get("notes") || null,
    months_of_collection: parseInteger(get("months_of_collection")),
  };
}
