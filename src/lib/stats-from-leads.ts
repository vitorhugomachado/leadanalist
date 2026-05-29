import type { LeadStatus } from "@/generated/prisma/client";
import { emptyBatchStats, type BatchStats } from "@/lib/batch-utils";

export function statsFromLeads(
  leads: Array<{ status: LeadStatus }>,
): BatchStats {
  const stats = emptyBatchStats();
  for (const lead of leads) {
    stats.total += 1;
    switch (lead.status) {
      case "NOVO": stats.novo += 1; break;
      case "CONTATO_INICIADO": stats.contatoIniciado += 1; break;
      case "SEM_RESPOSTA": stats.semResposta += 1; break;
      case "INTERESSADO": stats.interessado += 1; break;
      case "PROPOSTA_ENVIADA": stats.propostaEnviada += 1; break;
      case "NEGOCIACAO": stats.negociacao += 1; break;
      case "VENDIDO": stats.vendido += 1; break;
      case "PERDIDO": stats.perdido += 1; break;
    }
  }
  return stats;
}
