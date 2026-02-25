import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Contract, HubSpotDeal } from "@/types/database";

/** Compare date-only (YYYY-MM-DD). HubSpot may be "2026-02-01 08:00" → strip to 10 chars. */
function dateOnly(value: string | null | undefined): string | null {
  if (value == null || value === "") return null;
  const s = String(value).trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

function isDateMismatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const x = dateOnly(a);
  const y = dateOnly(b);
  if (x == null && y == null) return false;
  return x !== y;
}

function status(contract: Contract): "active" | "expired" {
  const today = new Date().toISOString().slice(0, 10);
  if (!contract.end_date) return "active";
  return contract.end_date >= today ? "active" : "expired";
}

export function ContractsTable({
  contracts,
  hubspot,
}: {
  contracts: Contract[];
  hubspot?: Map<string, HubSpotDeal>;
}) {
  if (contracts.length === 0) {
    return (
      <div className="rounded-md border py-12 text-center text-muted-foreground">
        No contracts match the filters. Try adjusting filters or import data.
      </div>
    );
  }

  const hasHubspot = hubspot && hubspot.size > 0;

  return (
    <div className="rounded-md border text-xs">
      <Table className="[&_th]:h-8 [&_th]:py-1 [&_th]:px-2 [&_td]:py-1 [&_td]:px-2">
        <TableHeader>
          <TableRow>
            <TableHead>Deal ID</TableHead>
            {hasHubspot && <TableHead>Deal Name</TableHead>}
            {hasHubspot && <TableHead>Associated Company</TableHead>}
            <TableHead>Category</TableHead>
            <TableHead>Country</TableHead>
            <TableHead>Retailer</TableHead>
            {hasHubspot && <TableHead>Deal Owner</TableHead>}
            <TableHead>Quota</TableHead>
            {hasHubspot && <TableHead>Amount</TableHead>}
            {hasHubspot && <TableHead>ARR</TableHead>}
            {hasHubspot && <TableHead>MRR</TableHead>}
            <TableHead>Start</TableHead>
            <TableHead>End</TableHead>
            {hasHubspot && <TableHead>HubSpot Start</TableHead>}
            {hasHubspot && <TableHead>HubSpot End</TableHead>}
            {hasHubspot && <TableHead>HubSpot Close</TableHead>}
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contracts.map((c) => {
            const deal = hubspot?.get(c.deal_id);
            const startMismatch = deal ? isDateMismatch(deal.hs_start_date, c.start_date) : false;
            const endMismatch = deal ? isDateMismatch(deal.hs_end_date, c.end_date) : false;
            return (
              <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell>
                  <Link
                    href={`/contracts/${encodeURIComponent(c.deal_id)}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {c.deal_id}
                  </Link>
                </TableCell>
                {hasHubspot && (
                  <TableCell className="max-w-[180px] truncate">{deal?.deal_name ?? "—"}</TableCell>
                )}
                {hasHubspot && (
                  <TableCell className="max-w-[140px] truncate">{deal?.associated_company ?? "—"}</TableCell>
                )}
                <TableCell>{c.category_code ?? "—"}</TableCell>
                <TableCell>{c.country ?? "—"}</TableCell>
                <TableCell>{c.retailer_simple ?? c.retailer ?? "—"}</TableCell>
                {hasHubspot && <TableCell>{deal?.deal_owner ?? "—"}</TableCell>}
                <TableCell>{c.monthly_quota ?? "—"}</TableCell>
                {hasHubspot && (
                  <TableCell>
                    {deal?.amount != null ? deal.amount.toLocaleString() : "—"}
                  </TableCell>
                )}
                {hasHubspot && (
                  <TableCell>
                    {deal?.annual_recurring_revenue != null
                      ? deal.annual_recurring_revenue.toLocaleString()
                      : "—"}
                  </TableCell>
                )}
                {hasHubspot && (
                  <TableCell>
                    {deal?.monthly_recurring_revenue != null
                      ? deal.monthly_recurring_revenue.toLocaleString()
                      : "—"}
                  </TableCell>
                )}
                <TableCell>{c.start_date ?? "—"}</TableCell>
                <TableCell>{c.end_date ?? "—"}</TableCell>
                {hasHubspot && (
                  <TableCell>
                    <span>{deal?.hs_start_date ?? "—"}</span>
                    {startMismatch && (
                      <Badge variant="outline" className="ml-1 border-amber-500 bg-amber-50 text-amber-800">
                        Mismatch
                      </Badge>
                    )}
                  </TableCell>
                )}
                {hasHubspot && (
                  <TableCell>
                    <span>{deal?.hs_end_date ?? "—"}</span>
                    {endMismatch && (
                      <Badge variant="outline" className="ml-1 border-amber-500 bg-amber-50 text-amber-800">
                        Mismatch
                      </Badge>
                    )}
                  </TableCell>
                )}
                {hasHubspot && <TableCell>{deal?.hs_close_date ?? "—"}</TableCell>}
                <TableCell>
                  <Badge variant={status(c) === "active" ? "default" : "secondary"}>
                    {status(c)}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
