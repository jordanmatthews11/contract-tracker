"use client";

import { useCallback, useState } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mapJobSummaryRow } from "@/lib/job-summary-import";
import type { JobSummaryExportRow } from "@/types/database";
import { Upload, FileSpreadsheet, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

type ImportRow = Omit<JobSummaryExportRow, "id" | "imported_at">;

function parseJobSummaryCsv(csvText: string): ImportRow[] {
  const parsed = Papa.parse<string[]>(csvText, { header: false, skipEmptyLines: true });
  const rows = (parsed.data ?? []) as string[][];
  const startIndex = rows[0]?.length === 1 ? 1 : 0;
  const dataRows = rows.slice(startIndex + 1).filter((row) => row.length > 0);
  return dataRows.map((row) => mapJobSummaryRow(row));
}

export function JobSummaryUpload() {
  const router = useRouter();
  const [parsed, setParsed] = useState<ImportRow[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const onFile = useCallback((file: File) => {
    setMessage(null);
    if (!file.name.endsWith(".csv")) {
      setMessage({ type: "error", text: "Please upload a CSV file." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const rows = parseJobSummaryCsv(text);
      if (rows.length === 0) {
        setMessage({ type: "error", text: "No data rows found. Ensure the CSV has a header row and data." });
        return;
      }
      setParsed(rows);
    };
    reader.onerror = () => setMessage({ type: "error", text: "Failed to read file." });
    reader.readAsText(file);
  }, []);

  const handleImport = useCallback(async () => {
    if (!parsed?.length) return;
    setImporting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/job-summary/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: parsed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "error", text: (data.error as string) || "Import failed." });
        return;
      }
      setMessage({ type: "success", text: `Imported ${(data.imported as number) ?? 0} rows.` });
      setParsed(null);
      router.refresh();
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Import failed." });
    } finally {
      setImporting(false);
    }
  }, [parsed, router]);

  const preview = parsed?.slice(0, 10) ?? [];

  return (
    <>
      <Card
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-muted-foreground/25 bg-muted/20"
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Job Summary CSV
          </CardTitle>
          <CardDescription>
            Drop a JobSummaryExport CSV or choose file. First line (timestamp) is skipped; columns A, E, F, K, L, N, O are stored.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            type="file"
            accept=".csv"
            className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-primary-foreground"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
          />
        </CardContent>
      </Card>

      {message && (
        <div
          className={`rounded-md border px-4 py-2 text-sm ${
            message.type === "success"
              ? "border-green-500/50 bg-green-50 text-green-900"
              : "border-destructive/50 bg-destructive/10 text-destructive"
          }`}
        >
          {message.text}
        </div>
      )}

      {parsed && parsed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Preview (first 10 rows)
            </CardTitle>
            <CardDescription>
              {parsed.length.toLocaleString()} rows. Job Id, Name, Client, Start, End, Bounty, Charge.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-2 font-medium">Job Id</th>
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">Client</th>
                    <th className="px-3 py-2 font-medium">Start Date</th>
                    <th className="px-3 py-2 font-medium">End Date</th>
                    <th className="px-3 py-2 font-medium">Bounty</th>
                    <th className="px-3 py-2 font-medium">Charge</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="px-3 py-2">{row.job_id ?? "—"}</td>
                      <td className="px-3 py-2 max-w-[280px] truncate">{row.name ?? "—"}</td>
                      <td className="px-3 py-2 max-w-[180px] truncate">{row.client ?? "—"}</td>
                      <td className="px-3 py-2">{row.start_date ?? "—"}</td>
                      <td className="px-3 py-2">{row.end_date ?? "—"}</td>
                      <td className="px-3 py-2">{row.bounty != null ? row.bounty : "—"}</td>
                      <td className="px-3 py-2">{row.charge != null ? row.charge : "—"}</td>
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
                  `Import ${parsed.length.toLocaleString()} rows`
                )}
              </Button>
              <Button variant="outline" onClick={() => { setParsed(null); setMessage(null); }}>
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
