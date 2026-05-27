import pg from "pg";

function poolConnectionString() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL não definida.");
  const url = new URL(raw.replace(/^postgres:/, "postgresql:"));
  url.searchParams.delete("sslmode");
  url.searchParams.delete("supa");
  return url.toString().replace(/^postgresql:/, "postgres:");
}

/** Pool Postgres (Supabase) com SSL compatível para dev no Windows. */
export function createPgPool() {
  return new pg.Pool({
    connectionString: poolConnectionString(),
    ssl: { rejectUnauthorized: false },
    max: 10,
  });
}
