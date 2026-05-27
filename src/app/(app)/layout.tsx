import { AppProviders } from "@/components/layout/app-providers";
import { AppShell } from "@/components/layout/app-shell";
import { prisma } from "@/lib/prisma";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const batches = await prisma.leadBatch.findMany({
    orderBy: { importedAt: "desc" },
    select: { id: true, name: true },
  });

  return (
    <AppProviders>
      <AppShell batches={batches}>{children}</AppShell>
    </AppProviders>
  );
}
