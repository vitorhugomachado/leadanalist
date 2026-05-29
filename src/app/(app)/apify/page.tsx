import { prisma } from "@/lib/prisma";
import { getBatchStats } from "@/lib/batch-queries";
import { ApifyPageClient } from "@/components/apify/apify-page-client";

export const dynamic = "force-dynamic";

export default async function ApifyPage() {
  const batches = await prisma.leadBatch.findMany({
    where: { source: "APIFY" },
    orderBy: { importedAt: "desc" },
    include: { importedBy: { select: { id: true, name: true, email: true } } },
  });

  const withStats = await Promise.all(
    batches.map(async (b) => ({
      ...b,
      importedAt: b.importedAt.toISOString(),
      stats: await getBatchStats(b.id),
    }))
  );

  return <ApifyPageClient initialBatches={withStats} />;
}
