import { prisma } from "@/lib/prisma";
import { getRunStatus, getDatasetItems, mapApifyPlaceToLead } from "@/lib/apify";

type Params = { params: Promise<{ batchId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { batchId } = await params;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(data: object) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      try {
        const batch = await prisma.leadBatch.findUnique({ where: { id: batchId } });
        if (!batch?.apifyRunId) {
          send({ error: "Run não encontrado" });
          controller.close();
          return;
        }

        let attempts = 0;
        const maxAttempts = 60; // 5 minutes max

        while (attempts < maxAttempts) {
          attempts++;
          const runStatus = await getRunStatus(batch.apifyRunId);
          send({ status: runStatus.status, attempt: attempts });

          if (runStatus.status === "SUCCEEDED") {
            send({ status: "PROCESSING", message: "Processando leads..." });

            const items = await getDatasetItems(runStatus.defaultDatasetId);
            let imported = 0;
            let duplicates = 0;

            for (const item of items) {
              if (item.permanentlyClosed || item.temporarilyClosed) continue;

              const leadData = mapApifyPlaceToLead(item, batchId);

              // Dedup by googleMapsUrl or phone
              const existing = await prisma.lead.findFirst({
                where: {
                  OR: [
                    leadData.googleMapsUrl ? { googleMapsUrl: leadData.googleMapsUrl } : undefined,
                    leadData.phone ? { phone: leadData.phone, batchId } : undefined,
                  ].filter(Boolean) as object[],
                },
              });

              if (existing) {
                await prisma.lead.update({
                  where: { id: existing.id },
                  data: leadData,
                });
                duplicates++;
              } else {
                await prisma.lead.create({ data: leadData });
                imported++;
              }

              if ((imported + duplicates) % 10 === 0) {
                send({ status: "PROCESSING", imported, duplicates, total: items.length });
              }
            }

            await prisma.leadBatch.update({
              where: { id: batchId },
              data: { apifyStatus: "SUCCEEDED", totalImported: imported },
            });

            send({ status: "DONE", imported, duplicates, total: items.length });
            controller.close();
            return;
          }

          if (runStatus.status === "FAILED" || runStatus.status === "ABORTED") {
            await prisma.leadBatch.update({
              where: { id: batchId },
              data: { apifyStatus: "FAILED" },
            });
            send({ status: "FAILED", error: "Run Apify falhou" });
            controller.close();
            return;
          }

          // Wait 5 seconds before next poll
          await new Promise((r) => setTimeout(r, 5000));
        }

        send({ status: "TIMEOUT", error: "Tempo limite atingido" });
        controller.close();
      } catch (e) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: String(e) })}\n\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
