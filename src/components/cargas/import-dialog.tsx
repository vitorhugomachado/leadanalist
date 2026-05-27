"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import { batchNameFromFileName } from "@/lib/batch-utils";
import {
  getSpreadsheetPreview,
  type ImportPreview,
} from "@/lib/import-spreadsheet";

type BatchOption = { id: string; name: string };

export function ImportDialog({
  batches = [],
  className = "",
}: {
  batches?: BatchOption[];
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [targetBatchId, setTargetBatchId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (batches.length > 0 && !targetBatchId) {
      setTargetBatchId(batches[0].id);
    }
  }, [batches, targetBatchId]);

  async function parseFile(f: File) {
    setFile(f);
    setError(null);
    const buffer = await f.arrayBuffer();
    setPreview(getSpreadsheetPreview(buffer));
    setOpen(true);
  }

  async function confirmImport() {
    if (!file) return;
    if (mode === "existing" && !targetBatchId) {
      setError("Selecione uma carga.");
      return;
    }

    setLoading(true);
    setError(null);

    const form = new FormData();
    form.append("file", file);
    if (mode === "existing") {
      form.append("batchId", targetBatchId);
    }

    const res = await fetch("/api/batches/import", { method: "POST", body: form });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Erro ao importar");
      toast(data.error ?? "Erro ao importar", "error");
      return;
    }

    toast(
      mode === "existing"
        ? `${data.importedCount} leads adicionados à carga.`
        : `Carga "${data.batch.name}" criada com ${data.importedCount} leads.`,
      "success",
    );
    setOpen(false);
    setFile(null);
    setPreview(null);
    router.push(`/cargas/${data.batch.id}`);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 ${className}`}
      >
        <Upload className="h-4 w-4" />
        Importar planilha
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void parseFile(f);
          e.target.value = "";
        }}
      />

      {open && preview && file && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !loading && setOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold">Confirmar importação</h2>
                <p className="text-sm text-zinc-500">{file.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="rounded-lg bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
                <strong>{preview.rowCount}</strong> leads encontrados
              </div>

              {preview.columns.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-zinc-500">
                    Colunas detectadas
                  </p>
                  <ul className="space-y-1 text-sm">
                    {preview.columns.map((c) => (
                      <li key={c.header} className="flex justify-between gap-2">
                        <span className="text-zinc-700">{c.header}</span>
                        <span className="text-zinc-400">
                          {c.field ?? "—"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {preview.sample.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-zinc-500">
                    Amostra
                  </p>
                  <div className="space-y-2 rounded-lg border border-zinc-200 p-3 text-xs">
                    {preview.sample.map((row, i) => (
                      <div key={i} className="border-b border-zinc-100 pb-2 last:border-0">
                        <span className="font-medium">{row.name}</span>
                        {row.phone && (
                          <span className="text-zinc-500"> · {row.phone}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-zinc-500">Destino</p>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={mode === "new"}
                    onChange={() => setMode("new")}
                  />
                  Nova carga: <strong>{batchNameFromFileName(file.name)}</strong>
                </label>
                {batches.length > 0 && (
                  <label className="flex flex-wrap items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={mode === "existing"}
                      onChange={() => setMode("existing")}
                    />
                    Adicionar à carga:
                    <select
                      value={targetBatchId}
                      onChange={(e) => setTargetBatchId(e.target.value)}
                      disabled={mode !== "existing"}
                      className="rounded-lg border border-zinc-200 px-2 py-1 text-sm"
                    >
                      {batches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>

              {error && <p className="text-sm text-rose-600">{error}</p>}

              <div className="flex justify-end gap-2 border-t border-zinc-100 pt-4">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={loading || preview.rowCount === 0}
                  onClick={() => void confirmImport()}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? "Importando…" : "Confirmar importação"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
