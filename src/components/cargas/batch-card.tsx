import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BatchNameEditor } from "@/components/cargas/batch-name-editor";
import { DeleteBatchButton } from "@/components/cargas/delete-batch-button";
import type { BatchWithStats } from "@/types/api";

export function BatchCard({ batch }: { batch: BatchWithStats }) {
  const { stats } = batch;

  return (
    <div className="relative rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:border-indigo-300 hover:shadow-md">
      <div className="absolute right-2 top-2 z-10">
        <DeleteBatchButton
          batchId={batch.id}
          batchName={batch.name}
          leadCount={stats.total}
        />
      </div>

      <Link href={`/cargas/${batch.id}`} className="block p-5 pr-12">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <BatchNameEditor
              batchId={batch.id}
              initialName={batch.name}
              size="md"
              stopLinkNavigation
            />
            <p className="mt-0.5 text-sm text-zinc-500">{batch.fileName}</p>
          </div>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
            {stats.total} leads
          </span>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Stat label="Novos" value={stats.novo} />
          <Stat label="Negociação" value={stats.negociacao} />
          <Stat label="Vendidos" value={stats.vendido} />
          <Stat label="Perdidos" value={stats.perdido} />
        </dl>

        <footer className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-zinc-100 pt-3 text-xs text-zinc-500">
          <span>
            Importado em{" "}
            {format(new Date(batch.importedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
          </span>
          <span>Responsável: {batch.importedBy.name}</span>
        </footer>
      </Link>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-zinc-500">{label}</dt>
      <dd className="font-semibold text-zinc-800">{value}</dd>
    </div>
  );
}
