import { notFound } from "next/navigation";
import { BatchWorkspace } from "@/components/batch/batch-workspace";
import { getBatchStats, leadsWhereBatch } from "@/lib/batch-queries";
import { prisma } from "@/lib/prisma";
import type { LeadRecord } from "@/types/api";

type Props = { params: Promise<{ batchId: string }> };

export const dynamic = "force-dynamic";

export default async function BatchPage({ params }: Props) {
  const { batchId } = await params;

  const batch = await prisma.leadBatch.findUnique({
    where: { id: batchId },
    include: { importedBy: { select: { name: true } } },
  });

  if (!batch) notFound();

  const [leads, stats] = await Promise.all([
    prisma.lead.findMany({
      where: leadsWhereBatch(batchId),
      orderBy: { updatedAt: "desc" },
    }),
    getBatchStats(batchId),
  ]);

  const leadRecords: LeadRecord[] = leads.map((l) => ({
    ...l,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  }));

  return (
    <div className="p-8">
      <BatchWorkspace
        batchId={batchId}
        batchName={batch.name}
        initialLeads={leadRecords}
        initialStats={stats}
      />
      <p className="mt-6 text-xs text-zinc-400">
        Importado por {batch.importedBy.name} · arquivo {batch.fileName}
      </p>
    </div>
  );
}
