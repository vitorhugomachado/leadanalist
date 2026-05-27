"use client";

import type { BatchStats } from "@/lib/batch-utils";
import { LEAD_STATUS_LABELS } from "@/lib/constants";

export function BatchCharts({ stats }: { stats: BatchStats }) {
  const items = [
    { key: "novo" as const, label: LEAD_STATUS_LABELS.NOVO, value: stats.novo, color: "bg-sky-500" },
    {
      key: "negociacao" as const,
      label: LEAD_STATUS_LABELS.NEGOCIACAO,
      value: stats.negociacao,
      color: "bg-amber-500",
    },
    {
      key: "vendido" as const,
      label: LEAD_STATUS_LABELS.VENDIDO,
      value: stats.vendido,
      color: "bg-emerald-500",
    },
    {
      key: "perdido" as const,
      label: LEAD_STATUS_LABELS.PERDIDO,
      value: stats.perdido,
      color: "bg-rose-500",
    },
  ];

  const max = Math.max(stats.total, 1);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <h3 className="mb-4 text-sm font-semibold text-zinc-700">Distribuição desta carga</h3>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.key}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-zinc-600">{item.label}</span>
              <span className="font-medium">{item.value}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-zinc-100">
              <div
                className={`h-full rounded-full ${item.color} transition-all`}
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-2xl font-bold text-zinc-900">{stats.total}</p>
      <p className="text-center text-xs text-zinc-500">total de leads na carga</p>
    </div>
  );
}
