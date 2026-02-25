"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { HubSpotDeal } from "@/types/database";

export type DuplicateGroup = {
  deal_id: string;
  category_code: string | null;
  retailer_simple: string | null;
  count: number;
};

export function ContractAlerts({
  hubspotNotInMapping,
  duplicateGroups,
}: {
  hubspotNotInMapping: HubSpotDeal[];
  duplicateGroups: DuplicateGroup[];
}) {
  const [showHubSpotModal, setShowHubSpotModal] = useState(false);
  const [showDupeModal, setShowDupeModal] = useState(false);
  const [ignoreExpired, setIgnoreExpired] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const visibleHubspotDeals = ignoreExpired
    ? hubspotNotInMapping.filter((d) => {
        const start = d.hs_start_date ? d.hs_start_date.slice(0, 10) : null;
        const end = d.hs_end_date ? d.hs_end_date.slice(0, 10) : null;
        if (start && start > today) return false;
        if (end && end < today) return false;
        return true;
      })
    : hubspotNotInMapping;

  return (
    <>
      {hubspotNotInMapping.length > 0 && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center justify-between gap-4">
          <span className="font-medium">
            {visibleHubspotDeals.length} HubSpot deal(s) not found in mapping sheet
            {ignoreExpired ? " (active window only)" : ""}.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIgnoreExpired((v) => !v)}
              className={`rounded-md border px-3 py-1 text-xs font-medium transition-colors ${
                ignoreExpired
                  ? "border-destructive bg-destructive text-white"
                  : "border-destructive/50 text-destructive hover:bg-destructive/20"
              }`}
            >
              {ignoreExpired ? "Showing active only" : "Ignore expired"}
            </button>
            {visibleHubspotDeals.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="border-destructive/50 text-destructive hover:bg-destructive/20"
                onClick={() => setShowHubSpotModal(true)}
              >
                View
              </Button>
            )}
          </div>
        </div>
      )}

      {duplicateGroups.length > 0 && (
        <div className="rounded-md border border-amber-500/50 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex items-center justify-between gap-4">
          <span className="font-medium">
            {duplicateGroups.length} duplicate Deal ID / Category / Retailer combination(s).
          </span>
          <Button
            variant="outline"
            size="sm"
            className="border-amber-600/50 text-amber-800 hover:bg-amber-100"
            onClick={() => setShowDupeModal(true)}
          >
            View
          </Button>
        </div>
      )}

      {showHubSpotModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="hubspot-modal-title"
        >
          <div className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-lg border bg-background shadow-lg flex flex-col">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 id="hubspot-modal-title" className="text-lg font-semibold">
                HubSpot deals not in mapping sheet
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setShowHubSpotModal(false)}>
                Close
              </Button>
            </div>
            <div className="overflow-auto flex-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Record ID</TableHead>
                    <TableHead>Deal Name</TableHead>
                    <TableHead>Associated Company</TableHead>
                    <TableHead>Deal Stage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleHubspotDeals.map((d) => (
                    <TableRow key={d.hs_deal_id}>
                      <TableCell className="font-medium">{d.hs_deal_id}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{d.deal_name ?? "—"}</TableCell>
                      <TableCell className="max-w-[180px] truncate">{d.associated_company ?? "—"}</TableCell>
                      <TableCell>{d.deal_stage ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}

      {showDupeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dupe-modal-title"
        >
          <div className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-lg border bg-background shadow-lg flex flex-col">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 id="dupe-modal-title" className="text-lg font-semibold">
                Duplicate Deal ID / Category / Retailer
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setShowDupeModal(false)}>
                Close
              </Button>
            </div>
            <div className="overflow-auto flex-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deal ID</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Retailer Simple</TableHead>
                    <TableHead>Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {duplicateGroups.map((g, i) => (
                    <TableRow key={`${g.deal_id}-${g.category_code ?? ""}-${g.retailer_simple ?? ""}-${i}`}>
                      <TableCell className="font-medium">{g.deal_id}</TableCell>
                      <TableCell>{g.category_code ?? "—"}</TableCell>
                      <TableCell>{g.retailer_simple ?? "—"}</TableCell>
                      <TableCell>{g.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
