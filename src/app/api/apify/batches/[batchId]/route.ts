import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ batchId: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const { batchId } = await params;
  const batch = await prisma.leadBatch.findUnique({ where: { id: batchId } });
  if (!batch) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  await prisma.leadBatch.delete({ where: { id: batchId } });
  return NextResponse.json({ ok: true });
}
