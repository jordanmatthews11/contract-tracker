"use client";

import { useCallback, useState } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DEFAULT_COLUMN_INDICES,
  mapRow,
  type ColumnMapping,
} from "@/lib/csv-import";
import { parseHubSpotCsv } from "@/lib/hubspot-import";
import type { HubSpotDeal } from "@/types/database";
import { Upload, FileSpreadsheet, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import type { ImportResult } from "@/app/api/contracts/import/route";

type Parsed = { headers: string[]; rows: string[][] };

function Section({
  title,
  count,
  color,
  children,
}: {
  title: string;
  count: number;
  color: "yellow" | "blue";
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const border = color === "yellow" ? "border-yellow-400/50 bg-yellow-50" : "border-blue-400/50 bg-blue-50";
  const text = color === "yellow" ? "text-yellow-900" : "text-blue-900";
  return (
    <div className={`rounded-md border ${border} px-4 py-3 text-sm ${text}`}>
      <button
        className="flex w-full items-center justify-between font-medium"
        onClick={() => setOpen((o) => !o)}
      >
        <span>{title} ({count})</span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

type HubSpotRow = Omit<HubSpotDeal, "imported_at">;

export default function ImportPage() {
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [mapping] = useState<ColumnMapping>(DEFAULT_COLUMN_INDICES);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [hubspotRows, setHubspotRows] = useState<HubSpotRow[] | null>(null);
  const [hubspotImporting, setHubspotImporting] = useState(false);
  const [hubspotResult, setHubspotResult] = useState<{ imported: number; updated: number } | null>(null);
  const [hubspotError, setHubspotError] = useState<string | null>(null);

  const onFile = useCallback((file: File) => {
    setResult(null);
    setError(null);
    if (!file.name.endsWith(".csv")) {
      setError("Please upload a CSV file. In Google Sheets: File → Download → CSV.");
      return;
    }
    Papa.parse(file, {
      header: false,
      complete: (res) => {
        const rows = res.data as string[][];
        if (!rows.length) { setError("No rows in file."); return; }
        const headers = (rows[0] ?? []).map((h) => String(h));
        const dataRows = rows.slice(1).filter((row) => row.some((c) => String(c).trim()));
        setParsed({ headers, rows: dataRows });
      },
      error: () => setError("Failed to parse file."),
    });
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  }, [onFile]);

  const handleImport = useCallback(async () => {
    if (!parsed) return;
    setImporting(true);
    setError(null);
    setResult(null);
    try {
      const mapped = parsed.rows.map((row) => mapRow(row, mapping));
      const res = await fetch("/api/contracts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: mapped }),
      });
      let data: ImportResult & { error?: string };
      try {
        data = await res.json();
      } catch {
        setError(res.ok ? "Import failed." : `Server error (${res.status}). Check that migration 002 is applied and Supabase env vars are correct.`);
        return;
      }
      if (!res.ok) {
        setError(typeof data?.error === "string" ? data.error : "Import failed.");
        return;
      }
      setResult(data as ImportResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setImporting(false);
    }
  }, [parsed, mapping]);

  const previewRows = parsed?.rows.slice(0, 10) ?? [];
  const mappedPreview = previewRows.map((row) => mapRow(row, mapping));

  const onHubSpotFile = useCallback((file: File) => {
    setHubspotResult(null);
    setHubspotError(null);
    if (!file.name.endsWith(".csv")) {
      setHubspotError("Please upload a CSV file (HubSpot deals export).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const rows = parseHubSpotCsv(text);
      if (rows.length === 0) {
        setHubspotError("No valid rows (Record ID required).");
        return;
      }
      setHubspotRows(rows);
    };
    reader.onerror = () => setHubspotError("Failed to read file.");
    reader.readAsText(file);
  }, []);

  const onHubSpotDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) onHubSpotFile(file);
  }, [onHubSpotFile]);

  const handleHubSpotImport = useCallback(async () => {
    if (!hubspotRows?.length) return;
    setHubspotImporting(true);
    setHubspotError(null);
    setHubspotResult(null);
    try {
      const res = await fetch("/api/hubspot/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: hubspotRows }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setHubspotError(typeof data?.error === "string" ? data.error : "Import failed.");
        return;
      }
      setHubspotResult({ imported: data.imported ?? 0, updated: data.updated ?? 0 });
    } catch (e) {
      setHubspotError(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setHubspotImporting(false);
    }
  }, [hubspotRows]);

  const hubspotPreview = hubspotRows?.slice(0, 10) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Import contracts</h1>
        <p className="text-muted-foreground">
          Upload the Mapping File as CSV (File → Download → CSV in Google Sheets).
        </p>
      </div>

      <Card
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-muted-foreground/25 bg-muted/20"
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Drop CSV or choose file
          </CardTitle>
          <CardDescription>
            Columns: A=Deal ID, B=Start, C=End, D=Category, E=Country, F=Store list,
            G=Retailer, H=Retailer Simple, I=Quota, J=Notes, K=Months
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            type="file"
            accept=".csv"
            className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-primary-foreground"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
          />
          <div className="flex items-center gap-2 border-t pt-4">
            <Button variant="outline" disabled title="Coming soon: live sync with Google Sheets">
              Connect Google Sheet
            </Button>
            <span className="text-xs text-muted-foreground">Placeholder for future live sync.</span>
          </div>
        </CardContent>
      </Card>

      <Card
        onDrop={onHubSpotDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-muted-foreground/25 bg-muted/20"
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import HubSpot Deals
          </CardTitle>
          <CardDescription>
            Drop a HubSpot deals CSV or choose file. Columns: Record ID, Deal Name, Associated Company, Amount, ARR, Start, End, Close.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            type="file"
            accept=".csv"
            className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-primary-foreground"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onHubSpotFile(f); }}
          />
        </CardContent>
      </Card>

      {hubspotError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {hubspotError}
        </div>
      )}

      {hubspotResult && (
        <div className="rounded-md border border-green-500/50 bg-green-50 px-4 py-3 text-sm text-green-900">
          <p className="font-medium">
            Imported {(hubspotResult.imported + hubspotResult.updated).toLocaleString()} HubSpot deals.
          </p>
        </div>
      )}

      {hubspotRows && hubspotRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              HubSpot preview (first 10 rows)
            </CardTitle>
            <CardDescription>
              {hubspotRows.length.toLocaleString()} deals detected. Import will upsert by Record ID.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-2 font-medium">Record ID</th>
                    <th className="px-3 py-2 font-medium">Deal Name</th>
                    <th className="px-3 py-2 font-medium">Company</th>
                    <th className="px-3 py-2 font-medium">Amount</th>
                    <th className="px-3 py-2 font-medium">ARR</th>
                    <th className="px-3 py-2 font-medium">Start</th>
                    <th className="px-3 py-2 font-medium">End</th>
                    <th className="px-3 py-2 font-medium">Close</th>
                  </tr>
                </thead>
                <tbody>
                  {hubspotPreview.map((row, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="px-3 py-2">{row.hs_deal_id}</td>
                      <td className="px-3 py-2 max-w-[180px] truncate">{row.deal_name ?? ""}</td>
                      <td className="px-3 py-2 max-w-[140px] truncate">{row.associated_company ?? ""}</td>
                      <td className="px-3 py-2">{row.amount != null ? row.amount.toLocaleString() : ""}</td>
                      <td className="px-3 py-2">{row.annual_recurring_revenue != null ? row.annual_recurring_revenue.toLocaleString() : ""}</td>
                      <td className="px-3 py-2">{row.hs_start_date ?? ""}</td>
                      <td className="px-3 py-2">{row.hs_end_date ?? ""}</td>
                      <td className="px-3 py-2">{row.hs_close_date ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={handleHubSpotImport} disabled={hubspotImporting}>
                {hubspotImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing…
                  </>
                ) : (
                  `Import ${hubspotRows.length.toLocaleString()} HubSpot deals`
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => { setHubspotRows(null); setHubspotResult(null); setHubspotError(null); }}
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div className="rounded-md border border-green-500/50 bg-green-50 px-4 py-3 text-sm text-green-900">
            <p className="font-medium">
              Import complete — {result.imported.toLocaleString()} unique rows saved to database
              {" "}(out of {result.totalRows.toLocaleString()} rows in file).
              {result.verifiedCount != null && ` Verified: ${result.verifiedCount.toLocaleString()} rows in database.`}
            </p>
          </div>

          {result.trueDuplicateCount > 0 && (
            <Section
              title={`True duplicate rows skipped (every cell matched another row exactly)`}
              count={result.trueDuplicateCount}
              color="yellow"
            >
              <p className="mb-2 text-xs text-yellow-800">
                These rows had identical values in every column — they were skipped since saving
                them again would add no new information. Everything else was saved.
              </p>
              <div className="max-h-48 overflow-y-auto rounded border border-yellow-300 bg-white">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-yellow-50">
                      <th className="px-3 py-1 text-left">#</th>
                      <th className="px-3 py-1 text-left">Deal ID</th>
                      <th className="px-3 py-1 text-left">Retailer Simple</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.trueDuplicateExamples.map((key, i) => {
                      const [dealId, retailer] = key.split(" | ");
                      return (
                        <tr key={i} className="border-b last:border-0">
                          <td className="px-3 py-1 text-muted-foreground">{i + 1}</td>
                          <td className="px-3 py-1">{dealId}</td>
                          <td className="px-3 py-1">{retailer}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {result.trueDuplicateCount > 50 && (
                <p className="mt-1 text-xs text-yellow-700">
                  Showing first 50 of {result.trueDuplicateCount} true duplicates.
                </p>
              )}
            </Section>
          )}

          {result.blankFieldRows.length > 0 && (
            <Section
              title={`Rows with blank cells`}
              count={result.blankFieldRows.length}
              color="blue"
            >
              <p className="mb-2 text-xs text-blue-800">
                These rows were still imported. Rows with no Deal ID were given a synthetic ID (e.g. _BLANK_ROW_5).
              </p>
              <div className="max-h-64 overflow-y-auto rounded border border-blue-300 bg-white">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-blue-50">
                      <th className="px-3 py-1 text-left">CSV Row #</th>
                      <th className="px-3 py-1 text-left">Blank fields</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.blankFieldRows.map((r, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="px-3 py-1">{r.row}</td>
                        <td className="px-3 py-1">{r.fields.join(", ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {result.blankFieldRows.length >= 200 && (
                <p className="mt-1 text-xs text-blue-700">
                  Showing first 200 affected rows.
                </p>
              )}
            </Section>
          )}
        </div>
      )}

      {parsed && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Preview (first 10 rows)
            </CardTitle>
            <CardDescription>
              {parsed.rows.length.toLocaleString()} total rows detected.
              All rows will be imported — blank cells are allowed, duplicates are merged (last value kept).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-2 font-medium">Deal ID</th>
                    <th className="px-3 py-2 font-medium">Retailer Simple</th>
                    <th className="px-3 py-2 font-medium">Retailer</th>
                    <th className="px-3 py-2 font-medium">Country</th>
                    <th className="px-3 py-2 font-medium">Quota</th>
                    <th className="px-3 py-2 font-medium">Start</th>
                    <th className="px-3 py-2 font-medium">End</th>
                  </tr>
                </thead>
                <tbody>
                  {mappedPreview.map((row, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="px-3 py-2">{row.deal_id || <span className="text-muted-foreground italic">blank</span>}</td>
                      <td className="px-3 py-2">{row.retailer_simple || <span className="text-muted-foreground italic">blank</span>}</td>
                      <td className="px-3 py-2 max-w-[180px] truncate">{row.retailer || ""}</td>
                      <td className="px-3 py-2">{row.country || ""}</td>
                      <td className="px-3 py-2">{row.monthly_quota ?? ""}</td>
                      <td className="px-3 py-2">{row.start_date ?? ""}</td>
                      <td className="px-3 py-2">{row.end_date ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={handleImport} disabled={importing}>
                {importing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing {parsed.rows.length.toLocaleString()} rows…
                  </>
                ) : (
                  `Import all ${parsed.rows.length.toLocaleString()} rows`
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => { setParsed(null); setResult(null); setError(null); }}
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
