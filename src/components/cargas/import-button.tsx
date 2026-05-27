import { prisma } from "@/lib/prisma";
import { ImportDialog } from "./import-dialog";

export async function ImportButtonWithBatches({ className = "" }: { className?: string }) {
  const batches = await prisma.leadBatch.findMany({
    orderBy: { importedAt: "desc" },
    select: { id: true, name: true },
  });

  return <ImportDialog batches={batches} className={className} />;
}
