import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json() as { name: string };

    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: "Nome da carga é obrigatório" },
        { status: 400 }
      );
    }

    const batch = await prisma.leadBatch.create({
      data: {
        name: body.name.trim(),
        fileName: "Criação Manual",
        importedById: user.id,
        source: "PLANILHA", // Default source
      },
    });

    return NextResponse.json({ batch });
  } catch (error) {
    console.error("Erro ao criar carga manual:", error);
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Sessão expirada. Recarregue a página ou faça login novamente." }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Falha ao criar carga manual" },
      { status: 500 }
    );
  }
}
