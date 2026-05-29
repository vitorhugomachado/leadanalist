import pg from "pg";

function poolConnectionString() {
  // Vercel Postgres (Neon) injeta POSTGRES_PRISMA_URL com pgbouncer nativo.
  // Fallback para DATABASE_URL para compatibilidade com dev local / Supabase.
  const raw =
    process.env.POSTGRES_PRISMA_URL ?? process.env.DATABASE_URL;
  if (!raw)
    throw new Error(
      "Nenhuma variável de conexão definida. Configure POSTGRES_PRISMA_URL (Vercel) ou DATABASE_URL (local)."
    );
  const url = new URL(raw.replace(/^postgres:/, "postgresql:"));
  url.searchParams.delete("sslmode");
  url.searchParams.delete("supa");
  return url.toString().replace(/^postgresql:/, "postgres:");
}

/** Pool Postgres com SSL compatível para Vercel Postgres (Neon) e dev local. */
export function createPgPool() {
  return new pg.Pool({
    connectionString: poolConnectionString(),
    ssl: { rejectUnauthorized: false },
    max: 10,
  });
}
