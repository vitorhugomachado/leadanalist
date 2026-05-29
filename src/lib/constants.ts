import type { LeadStatus } from "@/generated/prisma/client";

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NOVO: "Novo",
  CONTATO_INICIADO: "Contato Iniciado",
  SEM_RESPOSTA: "Sem Resposta",
  INTERESSADO: "Interessado",
  PROPOSTA_ENVIADA: "Proposta Enviada",
  NEGOCIACAO: "Negociação",
  VENDIDO: "Vendido",
  PERDIDO: "Perdido",
};

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  NOVO: "bg-sky-500/15 text-sky-700 border-sky-200",
  CONTATO_INICIADO: "bg-blue-500/15 text-blue-700 border-blue-200",
  SEM_RESPOSTA: "bg-gray-500/15 text-gray-600 border-gray-200",
  INTERESSADO: "bg-violet-500/15 text-violet-700 border-violet-200",
  PROPOSTA_ENVIADA: "bg-amber-500/15 text-amber-700 border-amber-200",
  NEGOCIACAO: "bg-orange-500/15 text-orange-800 border-orange-200",
  VENDIDO: "bg-emerald-500/15 text-emerald-800 border-emerald-200",
  PERDIDO: "bg-rose-500/15 text-rose-800 border-rose-200",
};

export const KANBAN_COLUMNS: LeadStatus[] = [
  "NOVO",
  "CONTATO_INICIADO",
  "SEM_RESPOSTA",
  "INTERESSADO",
  "PROPOSTA_ENVIADA",
  "NEGOCIACAO",
  "VENDIDO",
  "PERDIDO",
];

export const WHATSAPP_MESSAGE_TEMPLATE =
  "Olá, tudo bem?%0A%0AMeu nome é Vitor e trabalho com soluções de internet para empresas da sua região.%0A%0AVi sua empresa e gostaria de apresentar uma opção de internet empresarial com excelente estabilidade e suporte.%0A%0APosso lhe enviar mais informações?";
