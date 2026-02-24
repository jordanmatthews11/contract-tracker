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
import type { Contract } from "@/types/database";

function status(contract: Contract): "active" | "expired" {
  const today = new Date().toISOString().slice(0, 10);
  if (!contract.end_date) return "active";
  return contract.end_date >= today ? "active" : "expired";
}

export function ContractsTable({ contracts }: { contracts: Contract[] }) {
  if (contracts.length === 0) {
    return (
      <div className="rounded-md border py-12 text-center text-muted-foreground">
        No contracts match the filters. Try adjusting filters or import data.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Deal ID</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Country</TableHead>
            <TableHead>Retailer</TableHead>
            <TableHead>Quota</TableHead>
            <TableHead>Start</TableHead>
            <TableHead>End</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contracts.map((c) => (
            <TableRow key={`${c.deal_id}-${c.retailer_simple}`} className="cursor-pointer hover:bg-muted/50">
              <TableCell>
                <Link
                  href={`/contracts/${encodeURIComponent(c.deal_id)}`}
                  className="font-medium text-primary hover:underline"
                >
                  {c.deal_id}
                </Link>
              </TableCell>
              <TableCell>{c.category_code ?? "—"}</TableCell>
              <TableCell>{c.country ?? "—"}</TableCell>
              <TableCell>{c.retailer_simple ?? c.retailer ?? "—"}</TableCell>
              <TableCell>{c.monthly_quota ?? "—"}</TableCell>
              <TableCell>{c.start_date ?? "—"}</TableCell>
              <TableCell>{c.end_date ?? "—"}</TableCell>
              <TableCell>
                <Badge variant={status(c) === "active" ? "default" : "secondary"}>
                  {status(c)}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
