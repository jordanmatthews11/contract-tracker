import Papa from "papaparse";
import type { HubSpotDeal } from "@/types/database";

/** HubSpot date format "2026-02-01 08:00" → YYYY-MM-DD for storage and comparison */
export function parseHubSpotDate(value: string | undefined): string | null {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const datePart = trimmed.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  }
  return datePart;
}

export function parseNumeric(value: string | undefined): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = parseFloat(String(value).replace(/,/g, ""));
  return Number.isNaN(n) ? null : n;
}

export type HubSpotCsvRow = Record<string, string>;

const HEADER_MAP: Record<keyof Omit<HubSpotDeal, "imported_at">, string> = {
  hs_deal_id: "Record ID",
  deal_name: "Deal Name",
  fa_arr_type: "FA ARR Type",
  hs_start_date: "Start Date",
  hs_end_date: "End Date",
  hs_close_date: "Close Date",
  deal_owner: "Deal owner",
  amount: "Amount",
  associated_company: "Associated Company",
  annual_recurring_revenue: "Annual recurring revenue",
  monthly_recurring_revenue: "Monthly recurring revenue",
  deal_stage: "Deal Stage",
};

export function mapHubSpotRow(row: HubSpotCsvRow): Omit<HubSpotDeal, "imported_at"> | null {
  const id = row[HEADER_MAP.hs_deal_id]?.trim();
  if (!id) return null;

  return {
    hs_deal_id: id,
    deal_name: row[HEADER_MAP.deal_name]?.trim() || null,
    fa_arr_type: row[HEADER_MAP.fa_arr_type]?.trim() || null,
    hs_start_date: parseHubSpotDate(row[HEADER_MAP.hs_start_date]),
    hs_end_date: parseHubSpotDate(row[HEADER_MAP.hs_end_date]),
    hs_close_date: parseHubSpotDate(row[HEADER_MAP.hs_close_date]),
    deal_owner: row[HEADER_MAP.deal_owner]?.trim() || null,
    amount: parseNumeric(row[HEADER_MAP.amount]),
    associated_company: row[HEADER_MAP.associated_company]?.trim() || null,
    annual_recurring_revenue: parseNumeric(row[HEADER_MAP.annual_recurring_revenue]),
    monthly_recurring_revenue: parseNumeric(row[HEADER_MAP.monthly_recurring_revenue]),
    deal_stage: row[HEADER_MAP.deal_stage]?.trim() || null,
  };
}

/** Parse a HubSpot deals CSV string into typed rows (by header name). Skips rows without Record ID. */
export function parseHubSpotCsv(csvText: string): Omit<HubSpotDeal, "imported_at">[] {
  const parsed = Papa.parse<HubSpotCsvRow>(csvText, { header: true, skipEmptyLines: true });
  const rows: Omit<HubSpotDeal, "imported_at">[] = [];
  for (const row of parsed.data) {
    const mapped = mapHubSpotRow(row);
    if (mapped) rows.push(mapped);
  }
  return rows;
}
