import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { startApifyRun } from "@/lib/apify";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json() as {
      name: string;
      city: string;
      state: string;
      neighborhood?: string;
      keyword: string;
      maxItems: number;
    };

    const { name, city, state, neighborhood, keyword, maxItems } = body;
    if (!name || !city || !state || !keyword) {
      return NextResponse.json({ error: "Campos obrigatórios: nome, cidade, estado, palavra-chave" }, { status: 400 });
    }

    // Build search string for Google Maps
    const searchParts = [keyword, neighborhood, city, state, "Brasil"].filter(Boolean);
    const searchString = searchParts.join(", ");

    // Create batch record first
    const batch = await prisma.leadBatch.create({
      data: {
        name,
        fileName: `apify-${Date.now()}.json`,
        importedById: user.id,
        source: "APIFY",
        city,
        state,
        neighborhood: neighborhood ?? null,
        keyword,
        apifyStatus: "PENDING",
        totalImported: 0,
      },
    });

    // Start Apify run
    const run = await startApifyRun({
      searchString,
      maxCrawledPlacesPerSearch: maxItems,
      language: "pt",
      countryCode: "br",
    });

    // Save run ID
    await prisma.leadBatch.update({
      where: { id: batch.id },
      data: { apifyRunId: run.id, apifyStatus: "RUNNING" },
    });

    return NextResponse.json({ batchId: batch.id, runId: run.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha ao iniciar importação" },
      { status: 500 }
    );
  }
}
