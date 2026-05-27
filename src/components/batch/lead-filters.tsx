"use client";

import type { LeadStatus } from "@/generated/prisma/client";
import { LEAD_STATUS_LABELS } from "@/lib/constants";

export function LeadFilters({
  search,
  status,
  onSearchChange,
  onStatusChange,
}: {
  search: string;
  status: LeadStatus | "";
  onSearchChange: (v: string) => void;
  onStatusChange: (v: LeadStatus | "") => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        type="search"
        placeholder="Buscar nesta carga…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="min-w-[200px] flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      />
      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value as LeadStatus | "")}
        className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
      >
        <option value="">Todos os status</option>
        {(Object.keys(LEAD_STATUS_LABELS) as LeadStatus[]).map((s) => (
          <option key={s} value={s}>
            {LEAD_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
    </div>
  );
}
