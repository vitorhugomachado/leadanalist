"use client";

import { Download } from "lucide-react";

export function ExportBatchButton({ batchId }: { batchId: string }) {
  return (
    <a
      href={`/api/batches/${batchId}/export`}
      download
      className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
    >
      <Download className="h-4 w-4" />
      Exportar CSV
    </a>
  );
}
