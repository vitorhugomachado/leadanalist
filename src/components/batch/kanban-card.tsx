"use client";

import { useDraggable } from "@dnd-kit/core";
import { WhatsAppButton } from "@/components/lead/whatsapp-button";
import type { LeadRecord } from "@/types/api";

function truncateNotes(notes: string | null, max = 60) {
  if (!notes?.trim()) return null;
  const t = notes.trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

export function KanbanCard({
  lead,
  onEdit,
}: {
  lead: LeadRecord;
  onEdit: (lead: LeadRecord) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: { lead },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const notesPreview = truncateNotes(lead.notes);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border border-zinc-200 bg-white shadow-sm ${
        isDragging ? "opacity-50 ring-2 ring-indigo-300" : ""
      }`}
    >
      <div className="flex items-start gap-1 p-3">
        <button
          type="button"
          className="min-w-0 flex-1 cursor-grab text-left active:cursor-grabbing"
          {...listeners}
          {...attributes}
          onDoubleClick={() => onEdit(lead)}
        >
          <p className="font-medium text-zinc-900">{lead.name}</p>
          {lead.company && <p className="mt-1 text-xs text-zinc-500">{lead.company}</p>}
          {lead.phone && <p className="mt-1 text-xs text-zinc-600">{lead.phone}</p>}
          {lead.city && <p className="text-xs text-zinc-400">{lead.city}</p>}
          {notesPreview && (
            <p className="mt-1 text-xs italic text-zinc-500" title={lead.notes ?? undefined}>
              {notesPreview}
            </p>
          )}
        </button>
        <WhatsAppButton
          phone={lead.phone}
          leadName={lead.name}
          label={`WhatsApp de ${lead.name}`}
        />
      </div>
      <button
        type="button"
        onClick={() => onEdit(lead)}
        className="w-full border-t border-zinc-100 py-1.5 text-center text-xs text-indigo-600 hover:bg-indigo-50"
      >
        Editar
      </button>
    </div>
  );
}
