"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useCallback, useEffect, useState } from "react";
import type { LeadStatus } from "@/generated/prisma/client";
import { useToast } from "@/components/ui/toast-provider";
import { KANBAN_COLUMNS, LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from "@/lib/constants";
import type { LeadRecord } from "@/types/api";
import { KanbanCard } from "./kanban-card";

export function KanbanBoard({
  batchId,
  leads,
  onEditLead,
  onLeadStatusChange,
}: {
  batchId: string;
  leads: LeadRecord[];
  onEditLead: (lead: LeadRecord) => void;
  onLeadStatusChange?: (leadId: string, newStatus: LeadStatus, previousStatus: LeadStatus) => void;
}) {
  const { toast } = useToast();
  const [boardLeads, setBoardLeads] = useState(leads);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    setBoardLeads(leads);
  }, [leads]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const byStatus = KANBAN_COLUMNS.reduce(
    (acc, status) => {
      acc[status] = boardLeads.filter((l) => l.status === status);
      return acc;
    },
    {} as Record<LeadStatus, LeadRecord[]>,
  );

  const activeLead = activeId ? boardLeads.find((l) => l.id === activeId) : null;

  const moveLead = useCallback(
    async (leadId: string, newStatus: LeadStatus, previousStatus: LeadStatus) => {
      setBoardLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)),
      );

      const res = await fetch(`/api/batches/${batchId}/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        setBoardLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, status: previousStatus } : l)),
        );
        toast("Não foi possível mover o lead. Tente novamente.", "error");
        return;
      }

      onLeadStatusChange?.(leadId, newStatus, previousStatus);
    },
    [batchId, onLeadStatusChange, toast],
  );

  function onDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const leadId = String(active.id);
    const newStatus = over.data.current?.status as LeadStatus | undefined;
    if (!newStatus) return;

    const lead = boardLeads.find((l) => l.id === leadId);
    if (!lead || lead.status === newStatus) return;

    void moveLead(leadId, newStatus, lead.status);
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e) => setActiveId(String(e.active.id))}
      onDragEnd={onDragEnd}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {KANBAN_COLUMNS.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            leads={byStatus[status]}
            label={LEAD_STATUS_LABELS[status]}
            colorClass={LEAD_STATUS_COLORS[status]}
            onEdit={onEditLead}
          />
        ))}
      </div>
      <DragOverlay>
        {activeLead ? <KanbanCard lead={activeLead} onEdit={onEditLead} /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function KanbanColumn({
  status,
  leads,
  label,
  colorClass,
  onEdit,
}: {
  status: LeadStatus;
  leads: LeadRecord[];
  label: string;
  colorClass: string;
  onEdit: (lead: LeadRecord) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${status}`,
    data: { status },
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[320px] flex-col rounded-xl border p-3 ${
        isOver ? "border-indigo-400 bg-indigo-50/50" : "border-zinc-200 bg-zinc-100/80"
      }`}
    >
      <header
        className={`mb-3 flex items-center justify-between rounded-lg border px-3 py-2 text-sm font-semibold ${colorClass}`}
      >
        <span>{label}</span>
        <span className="text-xs opacity-80">{leads.length}</span>
      </header>
      <div className="flex flex-1 flex-col gap-2">
        {leads.length === 0 ? (
          <p className="py-8 text-center text-xs text-zinc-400">Nenhum lead</p>
        ) : (
          leads.map((lead) => (
            <KanbanCard key={lead.id} lead={lead} onEdit={onEdit} />
          ))
        )}
      </div>
    </div>
  );
}
