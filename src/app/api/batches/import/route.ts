import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertBatchExists } from "@/lib/batch-queries";
import { batchNameFromFileName } from "@/lib/batch-utils";
import { parseSpreadsheetBuffer } from "@/lib/import-spreadsheet";
import { prisma } from "@/lib/prisma";

const MAX_ROWS = 10_000;
const MAX_FILE_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const existingBatchId = formData.get("batchId");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: "Arquivo muito grande (máx. 10 MB)" },
        { status: 400 },
      );
    }

    const fileName = file.name;
    const buffer = await file.arrayBuffer();
    const rows = parseSpreadsheetBuffer(buffer);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Nenhum lead válido encontrado na planilha" },
        { status: 400 },
      );
    }

    if (rows.length > MAX_ROWS) {
      return NextResponse.json(
        { error: `Máximo de ${MAX_ROWS} leads por importação` },
        { status: 400 },
      );
    }

    const user = await getCurrentUser();
    const leadCreates = rows.map((row) => ({
      name: row.name,
      email: row.email,
      phone: row.phone,
      company: row.company,
      city: row.city,
      notes: row.notes,
      status: "NOVO" as const,
    }));

    if (existingBatchId && typeof existingBatchId === "string") {
      await assertBatchExists(existingBatchId);

      const batch = await prisma.leadBatch.update({
        where: { id: existingBatchId },
        data: {
          leads: { create: leadCreates },
        },
        include: {
          importedBy: { select: { id: true, name: true, email: true } },
          _count: { select: { leads: true } },
        },
      });

      return NextResponse.json({
        batch,
        importedCount: rows.length,
        appended: true,
      });
    }

    const batchName = batchNameFromFileName(fileName);
    const batch = await prisma.leadBatch.create({
      data: {
        name: batchName,
        fileName,
        importedById: user.id,
        leads: { create: leadCreates },
      },
      include: {
        importedBy: { select: { id: true, name: true, email: true } },
        _count: { select: { leads: true } },
      },
    });

    return NextResponse.json({
      batch,
      importedCount: rows.length,
      appended: false,
    });
  } catch (e) {
    console.error(e);
    if (e instanceof Error && e.message === "Carga não encontrada") {
      return NextResponse.json({ error: e.message }, { status: 404 });
    }
    return NextResponse.json({ error: "Falha ao importar planilha" }, { status: 500 });
  }
}
