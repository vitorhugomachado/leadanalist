import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { createPgPool } from "@/lib/db-pool";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient;
  pgPool: ReturnType<typeof createPgPool>;
};

function createPrismaClient() {
  const pool = globalForPrisma.pgPool ?? createPgPool();
  if (!globalForPrisma.pgPool) globalForPrisma.pgPool = pool;

  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
