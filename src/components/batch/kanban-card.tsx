"use client";

import { useDraggable } from "@dnd-kit/core";
import type { LeadRecord } from "@/types/api";

export function KanbanCard({ lead }: { lead: LeadRecord }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: { lead },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab rounded-lg border border-zinc-200 bg-white p-3 shadow-sm active:cursor-grabbing ${
        isDragging ? "opacity-50 ring-2 ring-indigo-300" : ""
      }`}
    >
      <p className="font-medium text-zinc-900">{lead.name}</p>
      {lead.company && <p className="mt-1 text-xs text-zinc-500">{lead.company}</p>}
      {lead.phone && <p className="mt-1 text-xs text-zinc-600">{lead.phone}</p>}
      {lead.city && <p className="text-xs text-zinc-400">{lead.city}</p>}
    </div>
  );
}
