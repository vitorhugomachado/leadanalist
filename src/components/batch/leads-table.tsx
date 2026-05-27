import { LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from "@/lib/constants";
import type { LeadRecord } from "@/types/api";

export function LeadsTable({ leads }: { leads: LeadRecord[] }) {
  if (leads.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
        Nenhum lead encontrado com os filtros atuais nesta carga.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500">
          <tr>
            <th className="px-4 py-3">Nome</th>
            <th className="px-4 py-3">Contato</th>
            <th className="px-4 py-3">Empresa</th>
            <th className="px-4 py-3">Cidade</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id} className="border-b border-zinc-100 last:border-0">
              <td className="px-4 py-3 font-medium">{lead.name}</td>
              <td className="px-4 py-3 text-zinc-600">
                {[lead.email, lead.phone].filter(Boolean).join(" · ") || "—"}
              </td>
              <td className="px-4 py-3 text-zinc-600">{lead.company ?? "—"}</td>
              <td className="px-4 py-3 text-zinc-600">{lead.city ?? "—"}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${LEAD_STATUS_COLORS[lead.status]}`}
                >
                  {LEAD_STATUS_LABELS[lead.status]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
