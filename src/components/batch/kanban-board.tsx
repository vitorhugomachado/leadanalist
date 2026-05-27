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
import { useCallback, useState } from "react";
import type { LeadStatus } from "@/generated/prisma/client";
import { KANBAN_COLUMNS, LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from "@/lib/constants";
import type { LeadRecord } from "@/types/api";
import { KanbanCard } from "./kanban-card";

export function KanbanBoard({
  batchId,
  initialLeads,
}: {
  batchId: string;
  initialLeads: LeadRecord[];
}) {
  const [leads, setLeads] = useState(initialLeads);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const byStatus = KANBAN_COLUMNS.reduce(
    (acc, status) => {
      acc[status] = leads.filter((l) => l.status === status);
      return acc;
    },
    {} as Record<LeadStatus, LeadRecord[]>,
  );

  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null;

  const moveLead = useCallback(
    async (leadId: string, status: LeadStatus) => {
      setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status } : l)));
      await fetch(`/api/batches/${batchId}/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    },
    [batchId],
  );

  function onDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const leadId = String(active.id);
    const newStatus = over.data.current?.status as LeadStatus | undefined;
    if (!newStatus) return;

    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status === newStatus) return;

    void moveLead(leadId, newStatus);
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
          />
        ))}
      </div>
      <DragOverlay>
        {activeLead ? <KanbanCard lead={activeLead} /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function KanbanColumn({
  status,
  leads,
  label,
  colorClass,
}: {
  status: LeadStatus;
  leads: LeadRecord[];
  label: string;
  colorClass: string;
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
        {leads.map((lead) => (
          <KanbanCard key={lead.id} lead={lead} />
        ))}
      </div>
    </div>
  );
}
