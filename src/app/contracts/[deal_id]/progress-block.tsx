"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

type Props = {
  dealId: string;
  retailerSimple: string;
  monthlyQuota: number;
  currentMonth: string;
  collected: number;
  updatedAt?: string;
};

export function ProgressBlock({
  dealId,
  retailerSimple,
  monthlyQuota,
  currentMonth,
  collected,
  updatedAt,
}: Props) {
  const router = useRouter();
  const [value, setValue] = useState(String(collected));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    const num = parseInt(value, 10);
    if (Number.isNaN(num) || num < 0) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deal_id: dealId,
          retailer_simple: retailerSimple,
          month: currentMonth,
          responses_collected: num,
          updated_by: null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const pct = monthlyQuota > 0 ? Math.min(100, (collected / monthlyQuota) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">This month ({currentMonth})</span>
        <span>
          {collected} / {monthlyQuota}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex flex-wrap items-end gap-2 pt-2">
        <div className="min-w-[120px]">
          <Label className="text-xs">Responses collected</Label>
          <Input
            type="number"
            min={0}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : saved ? (
            "Saved"
          ) : (
            "Update"
          )}
        </Button>
        {updatedAt && (
          <span className="text-xs text-muted-foreground">
            Last updated {new Date(updatedAt).toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
}
