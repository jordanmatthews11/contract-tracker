import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { JobSummaryExportRow } from "@/types/database";

export function JobSummaryTable({ rows }: { rows: JobSummaryExportRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-md border py-12 text-center text-muted-foreground">
        No job summary rows yet. Upload a CSV above.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Job Id</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Bounty</TableHead>
            <TableHead>Charge</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.job_id ?? "—"}</TableCell>
              <TableCell className="max-w-[280px] truncate">{row.name ?? "—"}</TableCell>
              <TableCell className="max-w-[180px] truncate">{row.client ?? "—"}</TableCell>
              <TableCell>{row.start_date ?? "—"}</TableCell>
              <TableCell>{row.end_date ?? "—"}</TableCell>
              <TableCell>{row.bounty != null ? row.bounty : "—"}</TableCell>
              <TableCell>{row.charge != null ? row.charge : "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
