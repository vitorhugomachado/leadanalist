"use client";

import { useEffect, useMemo, useState } from "react";
import type { LeadStatus } from "@/generated/prisma/client";
import { BatchCharts } from "@/components/batch/batch-charts";
import { KanbanBoard } from "@/components/batch/kanban-board";
import { LeadFilters } from "@/components/batch/lead-filters";
import { LeadsTable } from "@/components/batch/leads-table";
import type { BatchStats } from "@/lib/batch-utils";
import type { LeadRecord } from "@/types/api";

type Tab = "kanban" | "graficos" | "lista";

export function BatchWorkspace({
  batchId,
  batchName,
  initialLeads,
  stats,
}: {
  batchId: string;
  batchName: string;
  initialLeads: LeadRecord[];
  stats: BatchStats;
}) {
  const [tab, setTab] = useState<Tab>("kanban");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<LeadStatus | "">("");
  const [leads, setLeads] = useState(initialLeads);

  useEffect(() => {
    if (tab === "kanban") return;

    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (search.trim()) params.set("search", search.trim());

    const t = setTimeout(() => {
      void fetch(`/api/batches/${batchId}/leads?${params}`)
        .then((r) => r.json())
        .then((data: LeadRecord[]) => setLeads(data));
    }, 300);

    return () => clearTimeout(t);
  }, [batchId, search, status, tab]);

  const kanbanLeads = useMemo(() => {
    if (!search.trim() && !status) return initialLeads;
    const q = search.trim().toLowerCase();
    return initialLeads.filter((l) => {
      if (status && l.status !== status) return false;
      if (!q) return true;
      return [l.name, l.email, l.phone, l.company, l.city]
        .filter(Boolean)
        .some((f) => String(f).toLowerCase().includes(q));
    });
  }, [initialLeads, search, status]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "kanban", label: "Kanban" },
    { id: "graficos", label: "Gráficos" },
    { id: "lista", label: "Lista" },
  ];

  return (
    <div>
      <header className="mb-6">
        <p className="text-sm text-indigo-600">Carga</p>
        <h1 className="text-2xl font-bold text-zinc-900">{batchName}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Kanban, filtros e gráficos exclusivos desta importação — leads de outras cargas não
          aparecem aqui.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap gap-2 border-b border-zinc-200 pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              tab === t.id
                ? "bg-indigo-600 text-white"
                : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab !== "graficos" && (
        <div className="mb-4">
          <LeadFilters
            search={search}
            status={status}
            onSearchChange={setSearch}
            onStatusChange={setStatus}
          />
        </div>
      )}

      {tab === "kanban" && (
        <KanbanBoard batchId={batchId} initialLeads={kanbanLeads} />
      )}
      {tab === "graficos" && <BatchCharts stats={stats} />}
      {tab === "lista" && <LeadsTable leads={leads} />}
    </div>
  );
}
