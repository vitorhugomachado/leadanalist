"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Upload } from "lucide-react";

export function ImportButton({ className = "" }: { className?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File) {
    setLoading(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);

    const res = await fetch("/api/batches/import", { method: "POST", body: form });
    const data = await res.json();

    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Erro ao importar");
      return;
    }

    router.push(`/cargas/${data.batch.id}`);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
        className={`inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 ${className}`}
      >
        <Upload className="h-4 w-4" />
        {loading ? "Importando…" : "Importar planilha"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onFile(f);
          e.target.value = "";
        }}
      />
      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
    </>
  );
}
