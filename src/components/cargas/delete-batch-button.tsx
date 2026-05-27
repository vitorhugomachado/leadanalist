"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";

export function DeleteBatchButton({
  batchId,
  batchName,
  leadCount,
  variant = "icon",
}: {
  batchId: string;
  batchName: string;
  leadCount?: number;
  variant?: "icon" | "button";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const msg =
      leadCount != null && leadCount > 0
        ? `Excluir a carga "${batchName}" e todos os ${leadCount} leads? Esta ação não pode ser desfeita.`
        : `Excluir a carga "${batchName}"? Esta ação não pode ser desfeita.`;

    if (!window.confirm(msg)) return;

    setLoading(true);
    const res = await fetch(`/api/batches/${batchId}`, { method: "DELETE" });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Não foi possível excluir a carga.");
      return;
    }

    router.push("/cargas");
    router.refresh();
  }

  if (variant === "button") {
    return (
      <button
        type="button"
        disabled={loading}
        onClick={handleDelete}
        className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" />
        {loading ? "Excluindo…" : "Excluir carga"}
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={loading}
      title="Excluir carga"
      aria-label={`Excluir carga ${batchName}`}
      onClick={handleDelete}
      className="rounded-lg p-2 text-zinc-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
