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
import { Upload, FileSpreadsheet, Loader2 } from "lucide-react";

type Parsed = { headers: string[]; rows: string[][] };

export default function ImportPage() {
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>(DEFAULT_COLUMN_INDICES);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onFile = useCallback((file: File) => {
    setResult(null);
    setError(null);
    if (!file.name.endsWith(".csv") && !file.name.endsWith(".xlsx")) {
      setError("Please upload a CSV file (Excel export as CSV is supported).");
      return;
    }
    Papa.parse(file, {
      header: false,
      complete: (res) => {
        const rows = res.data as string[][];
        if (!rows.length) {
          setError("No rows in file.");
          return;
        }
        const headers = (rows[0] ?? []).map((h) => String(h));
        const dataRows = rows.slice(1).filter((row) => row.some((c) => String(c).trim()));
        setParsed({
          headers,
          rows: dataRows,
        });
        setMapping((m) => ({ ...DEFAULT_COLUMN_INDICES, ...m }));
      },
      error: () => setError("Failed to parse file."),
    });
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) onFile(file);
    },
    [onFile]
  );
  const onDragOver = useCallback((e: React.DragEvent) => e.preventDefault(), []);

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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }, [parsed, mapping]);

  const previewRows = parsed?.rows.slice(0, 10) ?? [];
  const mappedPreview = previewRows.map((row) => mapRow(row, mapping));

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
        onDragOver={onDragOver}
        className="border-2 border-dashed border-muted-foreground/25 bg-muted/20"
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Drop CSV or choose file
          </CardTitle>
          <CardDescription>
            Column mapping: A=Deal ID, B=Start, C=End, D=Category, E=Country, G=Store list,
            H=Retailer, I=Retailer Simple, J=Quota, K=Notes, L=Months
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            type="file"
            accept=".csv"
            className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-primary-foreground"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
            }}
          />
          <div className="flex items-center gap-2 border-t pt-4">
            <Button variant="outline" disabled title="Coming soon: live sync with Google Sheets">
              Connect Google Sheet
            </Button>
            <span className="text-xs text-muted-foreground">Placeholder for future live sync.</span>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-md border border-green-500/50 bg-green-500/10 px-4 py-2 text-sm text-green-800 dark:text-green-200">
          Imported {result.imported} rows. {result.skipped > 0 && `Skipped ${result.skipped} (missing deal_id or retailer_simple).`}
            {result.duplicatesRemoved > 0 && ` ${result.duplicatesRemoved} duplicate row(s) in file were merged.`}
        </div>
      )}

      {parsed && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Preview (first 10 rows)
              </CardTitle>
              <CardDescription>
                {parsed.rows.length} total rows. Re-importing will upsert by Deal ID + Retailer Simple.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-3 py-2 font-medium">Deal ID</th>
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
                        <td className="px-3 py-2">{row.deal_id}</td>
                        <td className="px-3 py-2">{row.retailer_simple ?? row.retailer}</td>
                        <td className="px-3 py-2">{row.country}</td>
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
                      Importing…
                    </>
                  ) : (
                    "Import"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setParsed(null);
                    setResult(null);
                    setError(null);
                  }}
                >
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

        </>
      )}
    </div>
  );
}
