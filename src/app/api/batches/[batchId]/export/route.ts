import { NextResponse } from "next/server";
import type { LeadStatus } from "@/generated/prisma/client";
import { assertBatchExists, leadsWhereBatch } from "@/lib/batch-queries";
import { LEAD_STATUS_LABELS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ batchId: string }> };

function escapeCsv(value: string) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(_request: Request, { params }: Params) {
  const { batchId } = await params;

  try {
    const batch = await assertBatchExists(batchId);
    const leads = await prisma.lead.findMany({
      where: leadsWhereBatch(batchId),
      orderBy: { name: "asc" },
    });

    const header = ["Nome", "Telefone", "E-mail", "Empresa", "Cidade", "Status", "Observações"];
    const rows = leads.map((l) =>
      [
        l.name,
        l.phone ?? "",
        l.email ?? "",
        l.company ?? "",
        l.city ?? "",
        LEAD_STATUS_LABELS[l.status as LeadStatus],
        l.notes ?? "",
      ]
        .map(escapeCsv)
        .join(","),
    );

    const csv = [header.join(","), ...rows].join("\n");
    const bom = "\uFEFF";

    return new NextResponse(bom + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${batch.name.replace(/[^\w\-]+/g, "_")}.csv"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Carga não encontrada" }, { status: 404 });
  }
}
