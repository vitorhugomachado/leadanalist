import { BatchCard } from "@/components/cargas/batch-card";
import { ImportButtonWithBatches } from "@/components/cargas/import-button";
import { getBatchStats } from "@/lib/batch-queries";
import { prisma } from "@/lib/prisma";
import type { BatchWithStats } from "@/types/api";

export default async function CargasPage() {
  const batches = await prisma.leadBatch.findMany({
    orderBy: { importedAt: "desc" },
    include: { importedBy: { select: { id: true, name: true, email: true } } },
  });

  const withStats: BatchWithStats[] = await Promise.all(
    batches.map(async (batch) => ({
      ...batch,
      importedAt: batch.importedAt.toISOString(),
      stats: await getBatchStats(batch.id),
    })),
  );

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Cargas de Leads</h1>
          <p className="mt-1 max-w-xl text-sm text-zinc-500">
            Cada importação de planilha cria uma carga separada. Os leads nunca se misturam
            entre cargas — clique em uma carga para abrir o Kanban exclusivo.
          </p>
        </div>
        <ImportButtonWithBatches />
      </div>

      {withStats.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center">
          <p className="text-lg font-medium text-zinc-700">Nenhuma carga ainda</p>
          <p className="mt-2 text-sm text-zinc-500">
            Ex.: ao importar <code className="rounded bg-zinc-100 px-1">leads55.xlsx</code>, será
            criada a carga <strong>leads55</strong>.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {withStats.map((batch) => (
            <BatchCard key={batch.id} batch={batch} />
          ))}
        </div>
      )}
    </div>
  );
}
