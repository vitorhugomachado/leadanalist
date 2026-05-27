import { NextResponse } from "next/server";
import { getBatchStats } from "@/lib/batch-queries";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ batchId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { batchId } = await params;
  const batch = await prisma.leadBatch.findUnique({
    where: { id: batchId },
    include: { importedBy: { select: { id: true, name: true, email: true } } },
  });

  if (!batch) {
    return NextResponse.json({ error: "Carga não encontrada" }, { status: 404 });
  }

  const stats = await getBatchStats(batchId);
  return NextResponse.json({ ...batch, stats });
}
