"use client";

import { useCallback, useMemo, useState } from "react";
import type { LeadStatus } from "@/generated/prisma/client";
import { BatchCharts } from "@/components/batch/batch-charts";
import { CreateManualLeadDialog } from "@/components/batch/create-manual-lead-dialog";
import { ExportBatchButton } from "@/components/batch/export-batch-button";
import { KanbanBoard } from "@/components/batch/kanban-board";
import { LeadFilters } from "@/components/batch/lead-filters";
import { LeadsTable } from "@/components/batch/leads-table";
import { BatchNameEditor } from "@/components/cargas/batch-name-editor";
import { DeleteBatchButton } from "@/components/cargas/delete-batch-button";
import { LeadEditModal } from "@/components/lead/lead-edit-modal";
import { useToast } from "@/components/ui/toast-provider";
import type { BatchStats } from "@/lib/batch-utils";
import { statsFromLeads } from "@/lib/stats-from-leads";
import type { LeadRecord } from "@/types/api";

type Tab = "kanban" | "graficos" | "lista";

function filterLeads(
  source: LeadRecord[],
  search: string,
  status: LeadStatus | "",
): LeadRecord[] {
  const q = search.trim().toLowerCase();
  const qDigits = search.replace(/\D/g, "");

  return source.filter((l) => {
    if (status && l.status !== status) return false;
    if (!q) return true;
    const fields = [l.name, l.email, l.phone, l.company, l.city, l.notes]
      .filter(Boolean)
      .map((f) => String(f).toLowerCase());
    if (fields.some((f) => f.includes(q))) return true;
    if (qDigits.length >= 4 && l.phone?.replace(/\D/g, "").includes(qDigits)) return true;
    return false;
  });
}

export function BatchWorkspace({
  batchId,
  batchName: initialBatchName,
  initialLeads,
  initialStats,
}: {
  batchId: string;
  batchName: string;
  initialLeads: LeadRecord[];
  initialStats: BatchStats;
}) {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("kanban");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<LeadStatus | "">("");
  const [allLeads, setAllLeads] = useState(initialLeads);
  const [stats, setStats] = useState(initialStats);
  const [editingLead, setEditingLead] = useState<LeadRecord | null>(null);
  const filteredLeads = useMemo(
    () => filterLeads(allLeads, search, status),
    [allLeads, search, status],
  );

  const refreshFromServer = useCallback(async () => {
    const res = await fetch(`/api/batches/${batchId}/leads`);
    if (!res.ok) return;
    const data = (await res.json()) as LeadRecord[];
    setAllLeads(data);
    setStats(statsFromLeads(data));
  }, [batchId]);

  const handleLeadSaved = (updated: LeadRecord) => {
    setAllLeads((prev) => {
      const next = prev.map((l) => (l.id === updated.id ? updated : l));
      setStats(statsFromLeads(next));
      return next;
    });
    toast("Lead atualizado.", "success");
  };

  const handleLeadStatusChange = (
    _leadId: string,
    newStatus: LeadStatus,
    previousStatus: LeadStatus,
  ) => {
    setStats((prev) => {
      const next = { ...prev };
      const dec = (key: keyof BatchStats) => {
        if (key !== "total") next[key] = Math.max(0, next[key] - 1);
      };
      const inc = (key: keyof BatchStats) => {
        if (key !== "total") next[key] += 1;
      };
      switch (previousStatus) {
        case "NOVO":
          dec("novo");
          break;
        case "NEGOCIACAO":
          dec("negociacao");
          break;
        case "VENDIDO":
          dec("vendido");
          break;
        case "PERDIDO":
          dec("perdido");
          break;
      }
      switch (newStatus) {
        case "NOVO":
          inc("novo");
          break;
        case "NEGOCIACAO":
          inc("negociacao");
          break;
        case "VENDIDO":
          inc("vendido");
          break;
        case "PERDIDO":
          inc("perdido");
          break;
      }
      return next;
    });
    setAllLeads((prev) =>
      prev.map((l) => (_leadId === l.id ? { ...l, status: newStatus } : l)),
    );
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "kanban", label: "Kanban" },
    { id: "graficos", label: "Gráficos" },
    { id: "lista", label: "Lista" },
  ];

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-indigo-600">Carga</p>
          <BatchNameEditor batchId={batchId} initialName={initialBatchName} size="lg" />
          <p className="mt-1 text-sm text-zinc-500">
            Kanban, filtros e gráficos exclusivos desta importação.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CreateManualLeadDialog batchId={batchId} onCreated={() => void refreshFromServer()} />
          <ExportBatchButton batchId={batchId} />
          <DeleteBatchButton
            batchId={batchId}
            batchName={initialBatchName}
            leadCount={stats.total}
            variant="button"
          />
        </div>
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
        <KanbanBoard
          batchId={batchId}
          leads={filteredLeads}
          onEditLead={setEditingLead}
          onLeadStatusChange={handleLeadStatusChange}
        />
      )}
      {tab === "graficos" && <BatchCharts stats={stats} />}
      {tab === "lista" && (
        <LeadsTable leads={filteredLeads} onEdit={setEditingLead} />
      )}

      <LeadEditModal
        batchId={batchId}
        lead={editingLead}
        open={!!editingLead}
        onClose={() => setEditingLead(null)}
        onSaved={(updated) => {
          handleLeadSaved(updated);
          void refreshFromServer();
        }}
      />
    </div>
  );
}
