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

export async function PATCH(request: Request, { params }: Params) {
  const { batchId } = await params;
  const body = (await request.json()) as { name?: string };
  const name = body.name?.trim();

  if (!name) {
    return NextResponse.json({ error: "Nome da carga é obrigatório" }, { status: 400 });
  }

  const existing = await prisma.leadBatch.findUnique({ where: { id: batchId } });
  if (!existing) {
    return NextResponse.json({ error: "Carga não encontrada" }, { status: 404 });
  }

  const batch = await prisma.leadBatch.update({
    where: { id: batchId },
    data: { name },
  });

  return NextResponse.json(batch);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { batchId } = await params;

  const batch = await prisma.leadBatch.findUnique({ where: { id: batchId } });
  if (!batch) {
    return NextResponse.json({ error: "Carga não encontrada" }, { status: 404 });
  }

  await prisma.leadBatch.delete({ where: { id: batchId } });

  return NextResponse.json({ ok: true });
}
