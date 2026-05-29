"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  MapPin, Plus, Trash2, ExternalLink, Download,
  Loader2, CheckCircle, XCircle, Clock, Copy
} from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import type { BatchStats } from "@/lib/batch-utils";

type ApifyBatch = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  keyword: string | null;
  apifyStatus: string | null;
  totalImported: number;
  importedAt: string;
  importedBy: { name: string; email: string };
  stats: BatchStats;
};

const KEYWORDS = [
  "mercado", "oficina", "restaurante", "barbearia", "clínica",
  "academia", "loja", "escola", "igreja", "empresa",
  "farmácia", "padaria", "supermercado", "hotel", "dentista",
  "advogado", "contador", "açougue", "petshop", "salão de beleza",
];

const MAX_ITEMS_OPTIONS = [50, 100, 250, 500, 1000];

type ProgressEvent = {
  status?: string;
  imported?: number;
  duplicates?: number;
  total?: number;
  message?: string;
  error?: string;
};

export function ApifyPageClient({ initialBatches }: { initialBatches: ApifyBatch[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [batches, setBatches] = useState(initialBatches);
  const [form, setForm] = useState({
    name: "", city: "", state: "", neighborhood: "",
    keyword: "restaurante", maxItems: 100,
  });
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<ProgressEvent | null>(null);
  const [progressBatchId, setProgressBatchId] = useState<string | null>(null);
  const abortRef = useRef<() => void>(() => {});

  const statesBR = [
    "AC","AL","AP","AM","BA","CE","DF","ES","GO",
    "MA","MT","MS","MG","PA","PB","PR","PE","PI",
    "RJ","RN","RS","RO","RR","SC","SP","SE","TO",
  ];

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.city || !form.state || !form.keyword) {
      toast("Preencha todos os campos obrigatórios", "error");
      return;
    }
    setImporting(true);
    setProgress({ status: "STARTING" });

    try {
      // Start the run
      const res = await fetch("/api/apify/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json() as { batchId?: string; error?: string };
      if (!res.ok || !data.batchId) {
        throw new Error(data.error ?? "Falha ao iniciar importação");
      }

      setProgressBatchId(data.batchId);
      setProgress({ status: "RUNNING" });

      // Start SSE polling
      const eventSource = new EventSource(`/api/apify/status/${data.batchId}`);
      let closed = false;
      abortRef.current = () => { eventSource.close(); closed = true; };

      eventSource.onmessage = (e) => {
        const evt = JSON.parse(e.data as string) as ProgressEvent;
        setProgress(evt);

        if (evt.status === "DONE") {
          eventSource.close();
          closed = true;
          toast(`✅ ${evt.imported} leads importados!`, "success");
          setImporting(false);
          setProgressBatchId(null);
          router.refresh();
          // Refresh batches
          fetch("/api/apify/batches")
            .then((r) => r.json())
            .then((d) => setBatches(d as ApifyBatch[]))
            .catch(console.error);
        }

        if (evt.status === "FAILED" || evt.error) {
          if (!closed) eventSource.close();
          toast(evt.error ?? "Importação falhou", "error");
          setImporting(false);
          setProgressBatchId(null);
        }
      };

      eventSource.onerror = () => {
        if (!closed) eventSource.close();
        setImporting(false);
        toast("Conexão SSE perdida", "error");
      };
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro desconhecido", "error");
      setImporting(false);
      setProgress(null);
    }
  }

  async function handleDelete(batchId: string, name: string) {
    if (!confirm(`Excluir carga "${name}" e todos os leads? Esta ação é irreversível.`)) return;
    const res = await fetch(`/api/apify/batches/${batchId}`, { method: "DELETE" });
    if (res.ok) {
      setBatches((prev) => prev.filter((b) => b.id !== batchId));
      toast("Carga excluída", "success");
    } else {
      toast("Erro ao excluir", "error");
    }
  }

  async function handleDuplicate(batch: ApifyBatch) {
    const newName = `${batch.name} (cópia)`;
    setForm({
      name: newName,
      city: batch.city ?? "",
      state: batch.state ?? "",
      neighborhood: "",
      keyword: batch.keyword ?? "restaurante",
      maxItems: 100,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast("Formulário preenchido com dados da carga. Ajuste e clique em Importar.", "success");
  }

  function exportCSV(batchId: string) {
    window.open(`/api/apify/batches/${batchId}/export?format=csv`, "_blank");
  }

  function getStatusBadge(status: string | null) {
    switch (status) {
      case "PENDING": return <span className="inline-flex items-center gap-1 rounded-full bg-gray-500/20 px-2 py-0.5 text-xs text-gray-400"><Clock className="h-3 w-3" />Aguardando</span>;
      case "RUNNING": return <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-400"><Loader2 className="h-3 w-3 animate-spin" />Processando</span>;
      case "SUCCEEDED": return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400"><CheckCircle className="h-3 w-3" />Concluído</span>;
      case "FAILED": return <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2 py-0.5 text-xs text-rose-400"><XCircle className="h-3 w-3" />Falhou</span>;
      default: return <span className="text-xs text-gray-500">—</span>;
    }
  }

  function getProgressPercent(): number {
    if (!progress) return 0;
    if (progress.status === "STARTING" || progress.status === "PENDING") return 5;
    if (progress.status === "RUNNING") return 30;
    if (progress.status === "PROCESSING" && progress.total) {
      return Math.min(90, 30 + ((progress.imported ?? 0) / progress.total) * 60);
    }
    if (progress.status === "DONE") return 100;
    return 20;
  }

  return (
    <div className="min-h-screen p-8" style={{ background: "#1E1E1E", color: "#FFFFFF" }}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="rounded-lg p-2" style={{ background: "#E67E22" }}>
            <MapPin className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Leads Apify</h1>
            <p style={{ color: "#B0B0B0" }} className="text-sm">Capture empresas do Google Maps e converta em leads automaticamente</p>
          </div>
        </div>
      </div>

      {/* Import Form Card */}
      <div className="mb-8 rounded-2xl border p-6" style={{ background: "#2A2A2A", borderColor: "#3A3A3A" }}>
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Plus className="h-5 w-5" style={{ color: "#E67E22" }} />
          Nova Importação
        </h2>

        <form onSubmit={(e) => void handleImport(e)}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Nome da carga */}
            <div className="lg:col-span-3">
              <label className="block text-sm font-medium mb-1" style={{ color: "#B0B0B0" }}>Nome da carga *</label>
              <input
                type="text"
                placeholder="Ex: Leads Maringá Restaurantes"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                className="w-full rounded-lg border px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2"
                style={{ background: "#1E1E1E", borderColor: "#3A3A3A", outlineColor: "#E67E22" }}
              />
            </div>

            {/* Cidade */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#B0B0B0" }}>Cidade *</label>
              <input
                type="text"
                placeholder="Ex: Maringá"
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                required
                className="w-full rounded-lg border px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none"
                style={{ background: "#1E1E1E", borderColor: "#3A3A3A", outlineColor: "#E67E22" }}
              />
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#B0B0B0" }}>Estado *</label>
              <select
                value={form.state}
                onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                required
                className="w-full rounded-lg border px-3 py-2 text-sm text-white focus:outline-none"
                style={{ background: "#1E1E1E", borderColor: "#3A3A3A", outlineColor: "#E67E22" }}
              >
                <option value="">Selecione</option>
                {statesBR.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Bairro */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#B0B0B0" }}>Bairro <span className="text-xs">(opcional)</span></label>
              <input
                type="text"
                placeholder="Ex: Centro"
                value={form.neighborhood}
                onChange={(e) => setForm((f) => ({ ...f, neighborhood: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none"
                style={{ background: "#1E1E1E", borderColor: "#3A3A3A", outlineColor: "#E67E22" }}
              />
            </div>

            {/* Palavra-chave */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#B0B0B0" }}>Palavra-chave *</label>
              <input
                list="keywords-list"
                type="text"
                placeholder="Ex: loja de roupas"
                value={form.keyword}
                onChange={(e) => setForm((f) => ({ ...f, keyword: e.target.value }))}
                required
                className="w-full rounded-lg border px-3 py-2 text-sm text-white focus:outline-none placeholder-gray-600"
                style={{ background: "#1E1E1E", borderColor: "#3A3A3A", outlineColor: "#E67E22" }}
              />
              <datalist id="keywords-list">
                {KEYWORDS.map((k) => <option key={k} value={k} />)}
              </datalist>
            </div>

            {/* Quantidade */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#B0B0B0" }}>Quantidade máxima</label>
              <select
                value={form.maxItems}
                onChange={(e) => setForm((f) => ({ ...f, maxItems: Number(e.target.value) }))}
                className="w-full rounded-lg border px-3 py-2 text-sm text-white focus:outline-none"
                style={{ background: "#1E1E1E", borderColor: "#3A3A3A", outlineColor: "#E67E22" }}
              >
                {MAX_ITEMS_OPTIONS.map((n) => <option key={n} value={n}>{n} leads</option>)}
              </select>
            </div>
          </div>

          {/* Progress bar */}
          {importing && progress && (
            <div className="mt-5">
              <div className="flex justify-between text-xs mb-1" style={{ color: "#B0B0B0" }}>
                <span>
                  {progress.status === "STARTING" && "Iniciando..."}
                  {progress.status === "RUNNING" && "Executando no Apify..."}
                  {progress.status === "PROCESSING" && `Processando leads: ${progress.imported ?? 0} importados, ${progress.duplicates ?? 0} duplicados`}
                  {progress.status === "DONE" && `Concluído! ${progress.imported} leads importados`}
                  {progress.error && `Erro: ${progress.error}`}
                </span>
                <span>{Math.round(getProgressPercent())}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "#3A3A3A" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${getProgressPercent()}%`, background: "#E67E22" }}
                />
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={importing}
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: importing ? "#555" : "#E67E22" }}
            >
              {importing ? <><Loader2 className="h-4 w-4 animate-spin" />Importando...</> : <><MapPin className="h-4 w-4" />Importar Leads</>}
            </button>
          </div>
        </form>
      </div>

      {/* Batches Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: "#2A2A2A", borderColor: "#3A3A3A" }}>
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#3A3A3A" }}>
          <h2 className="font-semibold">Cargas Importadas ({batches.length})</h2>
        </div>

        {batches.length === 0 ? (
          <div className="p-12 text-center" style={{ color: "#B0B0B0" }}>
            <MapPin className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Nenhuma importação ainda.</p>
            <p className="text-sm mt-1">Preencha o formulário acima para começar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid #3A3A3A" }}>
                  {["Nome", "Cidade", "Palavra-chave", "Leads", "Status", "Data", "Ações"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase" style={{ color: "#B0B0B0" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => (
                  <tr key={batch.id} style={{ borderBottom: "1px solid #3A3A3A" }} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-medium">{batch.name}</td>
                    <td className="px-4 py-3" style={{ color: "#B0B0B0" }}>{batch.city}{batch.state ? `, ${batch.state}` : ""}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full px-2 py-0.5 text-xs" style={{ background: "#E67E2220", color: "#E67E22" }}>{batch.keyword}</span>
                    </td>
                    <td className="px-4 py-3 font-medium">{batch.stats.total}</td>
                    <td className="px-4 py-3">{getStatusBadge(batch.apifyStatus)}</td>
                    <td className="px-4 py-3" style={{ color: "#B0B0B0" }}>
                      {format(new Date(batch.importedAt), "dd/MM/yy", { locale: ptBR })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <a
                          href={`/cargas/${batch.id}`}
                          title="Abrir Kanban"
                          className="rounded-lg p-1.5 transition-colors hover:bg-white/10"
                        >
                          <ExternalLink className="h-4 w-4" style={{ color: "#E67E22" }} />
                        </a>
                        <button
                          type="button"
                          title="Exportar CSV"
                          onClick={() => exportCSV(batch.id)}
                          className="rounded-lg p-1.5 transition-colors hover:bg-white/10"
                        >
                          <Download className="h-4 w-4" style={{ color: "#B0B0B0" }} />
                        </button>
                        <button
                          type="button"
                          title="Duplicar configuração"
                          onClick={() => void handleDuplicate(batch)}
                          className="rounded-lg p-1.5 transition-colors hover:bg-white/10"
                        >
                          <Copy className="h-4 w-4" style={{ color: "#B0B0B0" }} />
                        </button>
                        <button
                          type="button"
                          title="Excluir carga"
                          onClick={() => void handleDelete(batch.id, batch.name)}
                          className="rounded-lg p-1.5 transition-colors hover:bg-white/10"
                        >
                          <Trash2 className="h-4 w-4 text-rose-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
