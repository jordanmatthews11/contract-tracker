/**
 * Default column indices for Mapping File CSV (columns A–L; F skipped for our fields).
 * Headers in sheet: A=deal_id, B=start_d, C=end_da, D=simple_category_co, E=country,
 * G=Suggested Store List, H=Retailer, I=Retailer Simple, J=Monthly Quot, K=Notes, L=months of collection
 */
export const DEFAULT_COLUMN_INDICES: Record<string, number> = {
  deal_id: 0,       // A
  start_date: 1,    // B
  end_date: 2,      // C
  category_code: 3, // D
  country: 4,       // E
  suggested_store_list: 5, // F
  retailer: 6,      // G
  retailer_simple: 7, // H
  monthly_quota: 8, // I
  notes: 9,         // J
  months_of_collection: 10, // K
};

export type ColumnMapping = Record<string, number>;

export function parseDate(value: string | undefined): string | null {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

/** Safe max for monthly_quota / months_of_collection so we never send huge numbers to Postgres */
const MAX_SAFE_INT = 1_000_000;

export function parseInteger(value: string | undefined): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value < 0 || value > MAX_SAFE_INT) return null;
    return Math.floor(value);
  }
  const str = String(value).trim();
  if (str === "" || /e/i.test(str)) return null;
  const n = parseInt(str.replace(/[^0-9-]/g, ""), 10);
  return isNaN(n) || n < 0 || n > MAX_SAFE_INT ? null : n;
}

/** Normalize deal_id so long numbers from CSV/Excel don't become scientific notation. */
export function normalizeDealId(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "";
    return Math.abs(value) >= 1e15 ? value.toFixed(0) : String(value);
  }
  const s = String(value).trim();
  if (/e/i.test(s)) {
    const n = parseFloat(s);
    if (Number.isFinite(n)) return n >= 1e15 || n <= -1e15 ? n.toFixed(0) : String(Math.round(n));
  }
  return s;
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
    deal_id: normalizeDealId(row[mapping.deal_id] ?? get("deal_id")) || "",
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
