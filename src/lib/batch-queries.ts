import type { LeadStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { emptyBatchStats, type BatchStats } from "@/lib/batch-utils";

export async function getBatchStats(batchId: string): Promise<BatchStats> {
  const groups = await prisma.lead.groupBy({
    by: ["status"],
    where: { batchId },
    _count: { _all: true },
  });

  const stats = emptyBatchStats();
  for (const g of groups) {
    const n = g._count._all;
    stats.total += n;
    switch (g.status as LeadStatus) {
      case "NOVO": stats.novo = n; break;
      case "CONTATO_INICIADO": stats.contatoIniciado = n; break;
      case "SEM_RESPOSTA": stats.semResposta = n; break;
      case "INTERESSADO": stats.interessado = n; break;
      case "PROPOSTA_ENVIADA": stats.propostaEnviada = n; break;
      case "NEGOCIACAO": stats.negociacao = n; break;
      case "VENDIDO": stats.vendido = n; break;
      case "PERDIDO": stats.perdido = n; break;
    }
  }
  return stats;
}

export async function assertBatchExists(batchId: string) {
  const batch = await prisma.leadBatch.findUnique({ where: { id: batchId } });
  if (!batch) throw new Error("Carga não encontrada");
  return batch;
}

/** Garante que consultas de lead sempre filtram por carga. */
export function leadsWhereBatch(batchId: string, extra?: { status?: LeadStatus; search?: string }) {
  const where: {
    batchId: string;
    status?: LeadStatus;
    OR?: Array<{
      name?: { contains: string };
      email?: { contains: string };
      phone?: { contains: string };
      company?: { contains: string };
      city?: { contains: string };
    }>;
  } = { batchId };

  if (extra?.status) where.status = extra.status;
  if (extra?.search?.trim()) {
    const q = extra.search.trim();
    const insensitive = { contains: q, mode: "insensitive" as const };
    const digits = q.replace(/\D/g, "");
    const or: NonNullable<typeof where.OR> = [
      { name: insensitive },
      { email: insensitive },
      { phone: insensitive },
      { company: insensitive },
      { city: insensitive },
    ];
    if (digits.length >= 4) {
      or.push({ phone: { contains: digits } });
    }
    where.OR = or;
  }
  return where;
}
