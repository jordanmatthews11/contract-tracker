import { createServerSupabaseClient } from "@/lib/supabase-server";
import { JobSummaryUpload } from "./job-summary-upload";
import { JobSummaryTable } from "./job-summary-table";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function JobSummaryPage() {
  const supabase = createServerSupabaseClient();
  const { data: rows } = await supabase
    .from("job_summary_export")
    .select("*")
    .order("imported_at", { ascending: false })
    .limit(5000);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Job Summary Export</h1>
        <p className="text-muted-foreground">
          Upload a JobSummaryExport CSV. Stored columns: Job Id (A), Name (E), Client (F), Start Date (K), End Date (L), Bounty (N), Charge (O).
        </p>
      </div>

      <JobSummaryUpload />

      <JobSummaryTable rows={rows ?? []} />
    </div>
  );
}
