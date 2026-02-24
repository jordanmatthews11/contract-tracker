"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Contract } from "@/types/database";
import { Download } from "lucide-react";

type Props = {
  contracts: Contract[];
  totalContracts: number;
  avgQuota: number;
  country?: string;
  category?: string;
  retailer?: string;
  startDate?: string;
  endDate?: string;
  countries: string[];
  categories: string[];
  retailers: string[];
};

function toCSV(contracts: Contract[]): string {
  const headers = [
    "deal_id",
    "start_date",
    "end_date",
    "category_code",
    "country",
    "suggested_store_list",
    "retailer",
    "retailer_simple",
    "monthly_quota",
    "notes",
    "months_of_collection",
  ];
  const rows = contracts.map((c) =>
    headers.map((h) => {
      const v = (c as Record<string, unknown>)[h];
      if (v == null) return "";
      const s = String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
    })
  );
  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export function ReportsView({
  contracts,
  totalContracts,
  avgQuota,
  country,
  category,
  retailer,
  startDate,
  endDate,
  countries,
  categories,
  retailers,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/reports?${next.toString()}`);
  }

  function downloadCSV() {
    const csv = toCSV(contracts);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contracts-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const collectionRateNote = "Collection rate % can be added when progress data is joined.";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-muted-foreground">
          Filter and export contract data. Summary and CSV download.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-lg border bg-muted/30 p-4">
        <div className="min-w-[120px]">
          <Label className="text-xs">Country</Label>
          <Select value={country ?? "all"} onValueChange={(v) => update("country", v === "all" ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {countries.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[120px]">
          <Label className="text-xs">Category</Label>
          <Select value={category ?? "all"} onValueChange={(v) => update("category", v === "all" ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[180px]">
          <Label className="text-xs">Retailer</Label>
          <Select value={retailer ?? "all"} onValueChange={(v) => update("retailer", v === "all" ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {retailers.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[140px]">
          <Label className="text-xs">Start date (from)</Label>
          <Input
            type="date"
            value={startDate ?? ""}
            onChange={(e) => update("start", e.target.value)}
          />
        </div>
        <div className="min-w-[140px]">
          <Label className="text-xs">End date (to)</Label>
          <Input
            type="date"
            value={endDate ?? ""}
            onChange={(e) => update("end", e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total contracts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContracts}</div>
            <p className="text-xs text-muted-foreground">Rows matching filters</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Avg monthly quota</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgQuota}</div>
            <p className="text-xs text-muted-foreground">Among contracts with quota set</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Collection rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">{collectionRateNote}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export</CardTitle>
          <CardDescription>
            Download filtered results as CSV ({contracts.length} rows).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={downloadCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
