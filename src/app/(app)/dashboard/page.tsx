import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ImportButton } from "@/components/cargas/import-button";
import { getBatchStats } from "@/lib/batch-queries";
import { emptyBatchStats } from "@/lib/batch-utils";
import { LEAD_STATUS_LABELS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const batches = await prisma.leadBatch.findMany({
    orderBy: { importedAt: "desc" },
    include: { importedBy: { select: { name: true } } },
  });

  const summaries = await Promise.all(
    batches.map(async (b) => ({
      ...b,
      stats: await getBatchStats(b.id),
    })),
  );

  const totals = summaries.reduce(
    (acc, b) => ({
      total: acc.total + b.stats.total,
      novo: acc.novo + b.stats.novo,
      negociacao: acc.negociacao + b.stats.negociacao,
      vendido: acc.vendido + b.stats.vendido,
      perdido: acc.perdido + b.stats.perdido,
    }),
    emptyBatchStats(),
  );

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Dashboard geral</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Resumo consolidado de todas as cargas. Abra uma carga para ver dados isolados.
          </p>
        </div>
        <ImportButton />
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <SummaryCard label="Cargas" value={batches.length} />
        <SummaryCard label="Total de leads" value={totals.total} />
        <SummaryCard label={LEAD_STATUS_LABELS.NOVO} value={totals.novo} />
        <SummaryCard label={LEAD_STATUS_LABELS.NEGOCIACAO} value={totals.negociacao} />
        <SummaryCard label={LEAD_STATUS_LABELS.VENDIDO} value={totals.vendido} />
      </div>

      <h2 className="mb-4 text-lg font-semibold">Resumo por carga</h2>
      {summaries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center">
          <p className="text-zinc-600">Nenhuma carga importada ainda.</p>
          <p className="mt-2 text-sm text-zinc-500">
            Importe uma planilha para criar sua primeira carga de leads.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3">Carga</th>
                <th className="px-4 py-3">Importação</th>
                <th className="px-4 py-3">Responsável</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Novos</th>
                <th className="px-4 py-3 text-right">Negociação</th>
                <th className="px-4 py-3 text-right">Vendidos</th>
                <th className="px-4 py-3 text-right">Perdidos</th>
              </tr>
            </thead>
            <tbody>
              {summaries.map((b) => (
                <tr key={b.id} className="border-t border-zinc-100 hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <Link href={`/cargas/${b.id}`} className="font-medium text-indigo-600 hover:underline">
                      {b.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {format(new Date(b.importedAt), "dd/MM/yyyy", { locale: ptBR })}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{b.importedBy.name}</td>
                  <td className="px-4 py-3 text-right font-medium">{b.stats.total}</td>
                  <td className="px-4 py-3 text-right">{b.stats.novo}</td>
                  <td className="px-4 py-3 text-right">{b.stats.negociacao}</td>
                  <td className="px-4 py-3 text-right">{b.stats.vendido}</td>
                  <td className="px-4 py-3 text-right">{b.stats.perdido}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-zinc-900">{value}</p>
    </div>
  );
}
