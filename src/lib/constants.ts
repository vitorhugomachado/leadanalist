import type { LeadStatus } from "@/generated/prisma/client";

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NOVO: "Novos",
  NEGOCIACAO: "Em negociação",
  VENDIDO: "Vendidos",
  PERDIDO: "Perdidos",
};

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  NOVO: "bg-sky-500/15 text-sky-700 border-sky-200",
  NEGOCIACAO: "bg-amber-500/15 text-amber-800 border-amber-200",
  VENDIDO: "bg-emerald-500/15 text-emerald-800 border-emerald-200",
  PERDIDO: "bg-rose-500/15 text-rose-800 border-rose-200",
};

export const KANBAN_COLUMNS: LeadStatus[] = [
  "NOVO",
  "NEGOCIACAO",
  "VENDIDO",
  "PERDIDO",
];

export const DEFAULT_USER_EMAIL = "admin@leadanalist.local";
