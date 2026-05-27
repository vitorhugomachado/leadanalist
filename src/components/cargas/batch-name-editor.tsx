"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Check, Pencil, X } from "lucide-react";

export function BatchNameEditor({
  batchId,
  initialName,
  size = "lg",
  className = "",
  stopLinkNavigation = false,
}: {
  batchId: string;
  initialName: string;
  size?: "lg" | "md";
  className?: string;
  /** Evita abrir o link do card ao editar na lista de cargas. */
  stopLinkNavigation?: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initialName);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(initialName);
    if (!editing) setDraft(initialName);
  }, [initialName, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function stopIfNeeded(e: React.SyntheticEvent) {
    if (stopLinkNavigation) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  async function save() {
    const trimmed = draft.trim();
    if (!trimmed) {
      setError("Informe um nome.");
      return;
    }
    if (trimmed === name) {
      setEditing(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    const res = await fetch(`/api/batches/${batchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Não foi possível renomear.");
      return;
    }

    setName(trimmed);
    setEditing(false);
    router.refresh();
  }

  function cancel() {
    setDraft(name);
    setEditing(false);
    setError(null);
  }

  const titleClass =
    size === "lg"
      ? "text-2xl font-bold text-zinc-900"
      : "text-lg font-semibold text-zinc-900";

  if (editing) {
    return (
      <div
        className={`flex flex-wrap items-center gap-2 ${className}`}
        onClick={stopIfNeeded}
        onPointerDown={stopIfNeeded}
      >
        <input
          ref={inputRef}
          value={draft}
          disabled={loading}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void save();
            if (e.key === "Escape") cancel();
          }}
          className={`min-w-[180px] rounded-lg border border-indigo-300 px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-100 ${
            size === "lg" ? "text-xl font-bold" : "text-base font-semibold"
          }`}
        />
        <button
          type="button"
          disabled={loading}
          onClick={() => void save()}
          className="rounded-lg bg-indigo-600 p-2 text-white hover:bg-indigo-700 disabled:opacity-50"
          title="Salvar"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={cancel}
          className="rounded-lg border border-zinc-200 p-2 text-zinc-600 hover:bg-zinc-50"
          title="Cancelar"
        >
          <X className="h-4 w-4" />
        </button>
        {error && <p className="w-full text-sm text-rose-600">{error}</p>}
      </div>
    );
  }

  const TitleTag = size === "lg" ? "h1" : "h3";

  return (
    <div
      className={`group flex items-center gap-2 ${className}`}
      onClick={stopIfNeeded}
      onPointerDown={stopIfNeeded}
    >
      <TitleTag className={titleClass}>{name}</TitleTag>
      <button
        type="button"
        onClick={(e) => {
          stopIfNeeded(e);
          setDraft(name);
          setEditing(true);
        }}
        className="rounded-lg p-1.5 text-zinc-400 opacity-70 transition hover:bg-zinc-100 hover:text-indigo-600 group-hover:opacity-100"
        title="Renomear carga"
        aria-label="Renomear carga"
      >
        <Pencil className="h-4 w-4" />
      </button>
    </div>
  );
}
