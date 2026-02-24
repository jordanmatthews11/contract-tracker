import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, FileText, Calendar, TrendingDown } from "lucide-react";

function getCurrentMonthStart(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient();
  const today = new Date().toISOString().slice(0, 10);
  const in30 = new Date();
  in30.setDate(in30.getDate() + 30);
  const in30Str = in30.toISOString().slice(0, 10);
  const currentMonth = getCurrentMonthStart();

  const [{ data: contracts }, { data: progressLogs }] = await Promise.all([
    supabase.from("contracts").select("*").order("end_date", { nullsFirst: false }),
    supabase.from("progress_logs").select("deal_id, retailer_simple, month, responses_collected"),
  ]);

  const contractsList = contracts ?? [];
  const logs = progressLogs ?? [];

  const active = contractsList.filter((c) => !c.end_date || c.end_date >= today);
  const expiringSoon = contractsList.filter(
    (c) => c.end_date && c.end_date >= today && c.end_date <= in30Str
  );

  const logsByContract = new Map<string, number>();
  for (const log of logs) {
    if (log.month === currentMonth) {
      const key = `${log.deal_id}|${log.retailer_simple}`;
      logsByContract.set(key, (logsByContract.get(key) ?? 0) + (log.responses_collected ?? 0));
    }
  }

  const behindQuota: typeof contractsList = [];
  for (const c of contractsList) {
    if (!c.end_date || c.end_date >= today) {
      const key = `${c.deal_id}|${c.retailer_simple}`;
      const collected = logsByContract.get(key) ?? 0;
      const quota = c.monthly_quota ?? 0;
      if (quota > 0 && collected < quota) behindQuota.push(c);
    }
  }

  const usCount = contractsList.filter((c) => c.country === "US").length;
  const caCount = contractsList.filter((c) => c.country === "CA").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">
          Contract overview, expiring soon, and quota status.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active contracts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{active.length}</div>
            <p className="text-xs text-muted-foreground">
              End date in future or not set
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring in 30 days</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiringSoon.length}</div>
            <p className="text-xs text-muted-foreground">
              End date within next 30 days
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Behind quota</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{behindQuota.length}</div>
            <p className="text-xs text-muted-foreground">
              This month below monthly quota
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>By country</CardTitle>
            <CardDescription>US vs Canada contract rows</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">US</Badge>
                <span className="font-medium">{usCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">CA</Badge>
                <span className="font-medium">{caCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alerts
          </CardTitle>
          <CardDescription>
            Contracts expiring soon or behind this month&apos;s quota
          </CardDescription>
        </CardHeader>
        <CardContent>
          {expiringSoon.length === 0 && behindQuota.length === 0 ? (
            <p className="text-sm text-muted-foreground">No alerts.</p>
          ) : (
            <ul className="space-y-2">
              {expiringSoon.slice(0, 10).map((c) => (
                <li key={`${c.deal_id}-${c.retailer_simple}`} className="flex items-center gap-2 text-sm">
                  <Badge variant="outline">Expiring</Badge>
                  <Link
                    href={`/contracts/${encodeURIComponent(c.deal_id)}`}
                    className="text-primary hover:underline"
                  >
                    {c.deal_id}
                  </Link>
                  <span className="text-muted-foreground">{c.retailer_simple}</span>
                  <span className="text-muted-foreground">Ends {c.end_date}</span>
                </li>
              ))}
              {behindQuota.slice(0, 10).map((c) => (
                <li key={`${c.deal_id}-${c.retailer_simple}`} className="flex items-center gap-2 text-sm">
                  <Badge variant="secondary">Behind quota</Badge>
                  <Link
                    href={`/contracts/${encodeURIComponent(c.deal_id)}`}
                    className="text-primary hover:underline"
                  >
                    {c.deal_id}
                  </Link>
                  <span className="text-muted-foreground">{c.retailer_simple}</span>
                  <span className="text-muted-foreground">
                    {logsByContract.get(`${c.deal_id}|${c.retailer_simple}`) ?? 0} / {c.monthly_quota}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {(expiringSoon.length > 10 || behindQuota.length > 10) && (
            <Button asChild variant="link" className="mt-2 px-0">
              <Link href="/contracts">View all contracts</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
