import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { batchNameFromFileName } from "@/lib/batch-utils";
import { parseSpreadsheetBuffer } from "@/lib/import-spreadsheet";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
    }

    const fileName = file.name;
    const batchName = batchNameFromFileName(fileName);
    const buffer = await file.arrayBuffer();
    const rows = parseSpreadsheetBuffer(buffer);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Nenhum lead válido encontrado na planilha" },
        { status: 400 },
      );
    }

    const user = await getCurrentUser();

    const batch = await prisma.leadBatch.create({
      data: {
        name: batchName,
        fileName,
        importedById: user.id,
        leads: {
          create: rows.map((row) => ({
            name: row.name,
            email: row.email,
            phone: row.phone,
            company: row.company,
            city: row.city,
            notes: row.notes,
            status: "NOVO",
          })),
        },
      },
      include: {
        importedBy: { select: { id: true, name: true, email: true } },
        _count: { select: { leads: true } },
      },
    });

    return NextResponse.json({
      batch,
      importedCount: rows.length,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Falha ao importar planilha" }, { status: 500 });
  }
}
