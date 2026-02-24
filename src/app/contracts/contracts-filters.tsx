"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type Props = {
  country?: string;
  category?: string;
  retailer?: string;
  status?: string;
  q?: string;
  countries: string[];
  categories: string[];
  retailers: string[];
};

export function ContractFilters({
  country,
  category,
  retailer,
  status,
  q,
  countries,
  categories,
  retailers,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(q ?? "");

  function update(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/contracts?${next.toString()}`);
  }

  function applySearch() {
    const next = new URLSearchParams(searchParams.toString());
    if (searchQuery.trim()) next.set("q", searchQuery.trim());
    else next.delete("q");
    router.push(`/contracts?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-lg border bg-muted/30 p-4">
      <div className="min-w-[180px]">
        <Label className="text-xs">Search</Label>
        <Input
          placeholder="Deal ID or retailer..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applySearch()}
        />
      </div>
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
      <div className="min-w-[120px]">
        <Label className="text-xs">Status</Label>
        <Select value={status ?? "all"} onValueChange={(v) => update("status", v === "all" ? "" : v)}>
          <SelectTrigger>
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button variant="secondary" onClick={applySearch}>
        Apply search
      </Button>
    </div>
  );
}
