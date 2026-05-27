import { NextResponse } from "next/server";
import { getBatchStats } from "@/lib/batch-queries";
import { emptyBatchStats } from "@/lib/batch-utils";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const batches = await prisma.leadBatch.findMany({
    orderBy: { importedAt: "desc" },
    include: { importedBy: { select: { name: true } } },
  });

  const batchSummaries = await Promise.all(
    batches.map(async (b) => ({
      id: b.id,
      name: b.name,
      importedAt: b.importedAt,
      importedByName: b.importedBy.name,
      stats: await getBatchStats(b.id),
    })),
  );

  const totals = batchSummaries.reduce(
    (acc, b) => ({
      total: acc.total + b.stats.total,
      novo: acc.novo + b.stats.novo,
      negociacao: acc.negociacao + b.stats.negociacao,
      vendido: acc.vendido + b.stats.vendido,
      perdido: acc.perdido + b.stats.perdido,
    }),
    emptyBatchStats(),
  );

  return NextResponse.json({
    batchCount: batches.length,
    totals,
    batches: batchSummaries,
  });
}
