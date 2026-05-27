import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBatchStats } from "@/lib/batch-queries";

export async function GET() {
  const batches = await prisma.leadBatch.findMany({
    orderBy: { importedAt: "desc" },
    include: { importedBy: { select: { id: true, name: true, email: true } } },
  });

  const withStats = await Promise.all(
    batches.map(async (batch) => ({
      ...batch,
      stats: await getBatchStats(batch.id),
    })),
  );

  return NextResponse.json(withStats);
}
