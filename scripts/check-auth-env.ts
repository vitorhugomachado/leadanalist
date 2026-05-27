/**
 * Verifica variáveis de auth (usa .env.local).
 * Uso: npx tsx scripts/check-auth-env.ts
 */
import { config } from "dotenv";
import { validateAuthEnv } from "../src/lib/credentials";

config({ path: ".env.local" });

const result = validateAuthEnv();
if (result.ok) {
  console.log("OK — copie estas variáveis para a Vercel (Settings → Environment Variables):\n");
  console.log("ADMIN_EMAIL=" + process.env.ADMIN_EMAIL);
  console.log('ADMIN_PASSWORD_HASH="' + process.env.ADMIN_PASSWORD_HASH?.replace(/\\/g, "") + '"');
  console.log("AUTH_SECRET=" + (process.env.AUTH_SECRET?.length ?? 0) + " caracteres (copie o valor completo do .env.local)");
  console.log("DATABASE_URL= (copie do .env.local)");
  console.log("DIRECT_URL= (copie do .env.local)");
} else {
  console.log("Faltando:", result.missing.join(", "));
  process.exit(1);
}
