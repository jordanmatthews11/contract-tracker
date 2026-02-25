/**
 * Job Summary Export CSV: first line is "Export Timestamp: ...", second line is header.
 * We store columns A (Job Id), E (Name), F (Client), K (Start Date), L (End Date), N (Bounty), O (Charge).
 * Column indices 0-based: A=0, E=4, F=5, K=10, L=11, N=13, O=14.
 */

import type { JobSummaryExportRow } from "@/types/database";

const COL_JOB_ID = 0;
const COL_NAME = 4;
const COL_CLIENT = 5;
const COL_START_DATE = 10;
const COL_END_DATE = 11;
const COL_BOUNTY = 13;
const COL_CHARGE = 14;

function parseDate(value: string | undefined): string | null {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function parseNum(value: string | undefined): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = parseFloat(String(value).replace(/,/g, ""));
  return Number.isNaN(n) ? null : n;
}

export function mapJobSummaryRow(row: string[]): Omit<JobSummaryExportRow, "id" | "imported_at"> {
  const get = (i: number) => (row[i] !== undefined ? String(row[i]).trim() : "") || null;
  return {
    job_id: get(COL_JOB_ID),
    name: get(COL_NAME),
    client: get(COL_CLIENT),
    start_date: parseDate(row[COL_START_DATE]),
    end_date: parseDate(row[COL_END_DATE]),
    bounty: parseNum(row[COL_BOUNTY]),
    charge: parseNum(row[COL_CHARGE]),
  };
}
