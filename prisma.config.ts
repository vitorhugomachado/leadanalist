import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({ path: ".env.local" });
config();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Vercel Postgres: POSTGRES_URL_NON_POOLING (conexão direta, sem pgbouncer)
    // Fallback: DIRECT_URL (Supabase) → DATABASE_URL (genérico)
    url:
      process.env["POSTGRES_URL_NON_POOLING"] ??
      process.env["DIRECT_URL"] ??
      process.env["DATABASE_URL"],
  },
});
