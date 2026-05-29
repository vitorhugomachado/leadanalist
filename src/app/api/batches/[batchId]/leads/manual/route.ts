import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ batchId: string }> }) {
  try {
    await getCurrentUser();
    const { batchId } = await params;
    const body = await request.json() as {
      name: string;
      phone?: string;
      email?: string;
      company?: string;
      notes?: string;
    };

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
    }

    // Validate batch exists
    const batch = await prisma.leadBatch.findUnique({ where: { id: batchId } });
    if (!batch) {
      return NextResponse.json({ error: "Carga não encontrada" }, { status: 404 });
    }

    const lead = await prisma.lead.create({
      data: {
        batchId,
        name: body.name.trim(),
        phone: body.phone?.trim() || null,
        email: body.email?.trim() || null,
        company: body.company?.trim() || null,
        notes: body.notes?.trim() || null,
        status: "NOVO",
      },
    });

    return NextResponse.json({ lead });
  } catch (error) {
    console.error("Erro ao criar lead manual:", error);
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Sessão expirada. Recarregue a página ou faça login novamente." }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Falha ao criar lead manual" },
      { status: 500 }
    );
  }
}
