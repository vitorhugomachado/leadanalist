import { NextResponse } from "next/server";
import type { LeadStatus } from "@/generated/prisma/client";
import { assertBatchExists } from "@/lib/batch-queries";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ batchId: string; leadId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { batchId, leadId } = await params;

  try {
    await assertBatchExists(batchId);
  } catch {
    return NextResponse.json({ error: "Carga não encontrada" }, { status: 404 });
  }

  const existing = await prisma.lead.findFirst({
    where: { id: leadId, batchId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Lead não encontrado nesta carga" }, { status: 404 });
  }

  const body = (await request.json()) as {
    status?: LeadStatus;
    name?: string;
    email?: string | null;
    phone?: string | null;
    company?: string | null;
    city?: string | null;
    notes?: string | null;
  };

  const lead = await prisma.lead.update({
    where: { id: leadId },
    data: {
      ...(body.status && { status: body.status }),
      ...(body.name !== undefined && { name: body.name }),
      ...(body.email !== undefined && { email: body.email }),
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.company !== undefined && { company: body.company }),
      ...(body.city !== undefined && { city: body.city }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
  });

  return NextResponse.json(lead);
}
