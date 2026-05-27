import { NextResponse } from "next/server";
import type { LeadStatus } from "@/generated/prisma/client";
import { assertBatchExists, leadsWhereBatch } from "@/lib/batch-queries";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ batchId: string }> };

export async function GET(request: Request, { params }: Params) {
  const { batchId } = await params;

  try {
    await assertBatchExists(batchId);
  } catch {
    return NextResponse.json({ error: "Carga não encontrada" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as LeadStatus | null;
  const search = searchParams.get("search") ?? undefined;

  const leads = await prisma.lead.findMany({
    where: leadsWhereBatch(batchId, {
      status: status ?? undefined,
      search,
    }),
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(leads);
}
