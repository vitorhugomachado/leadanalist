import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ batchId: string }> };

export async function GET(request: Request, { params }: Params) {
  const { batchId } = await params;
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "csv";

  const leads = await prisma.lead.findMany({
    where: { batchId },
    orderBy: { createdAt: "asc" },
  });

  if (format === "csv") {
    const headers = ["Nome", "Telefone", "Email", "Empresa", "Categoria", "Endereço", "Bairro", "Cidade", "Estado", "CEP", "Site", "Nota", "Avaliações", "Google Maps", "Status", "Importado em"];
    const rows = leads.map((l) => [
      l.name, l.phone ?? "", l.email ?? "", l.company ?? "",
      l.category ?? "", l.address ?? "", l.neighborhood ?? "",
      l.city ?? "", "", l.zipCode ?? "", l.website ?? "",
      l.rating ?? "", l.reviewsCount ?? "", l.googleMapsUrl ?? "",
      l.status, l.createdAt.toISOString(),
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="leads-${batchId}.csv"`,
      },
    });
  }

  return NextResponse.json({ leads });
}
