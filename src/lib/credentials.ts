import bcrypt from "bcryptjs";

function readEnv(name: string): string | undefined {
  const raw = process.env[name];
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

/** Vercel/CLI às vezes escapam $ do bcrypt como \$ — normaliza. */
function normalizeBcryptHash(hash: string): string {
  return hash.replace(/\\\$/g, "$");
}

export function getAdminEmail(): string {
  const email = readEnv("ADMIN_EMAIL")?.toLowerCase();
  if (!email) {
    throw new Error("ADMIN_EMAIL");
  }
  return email;
}

export function getAdminPasswordHash(): string {
  const hash = readEnv("ADMIN_PASSWORD_HASH");
  if (!hash) {
    throw new Error("ADMIN_PASSWORD_HASH");
  }
  const normalized = normalizeBcryptHash(hash);
  if (!normalized.startsWith("$2")) {
    throw new Error("ADMIN_PASSWORD_HASH_INVALID");
  }
  return normalized;
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const hash = getAdminPasswordHash();
  return bcrypt.compare(password, hash);
}

export function validateAuthEnv(): { ok: true } | { ok: false; missing: string[] } {
  const missing: string[] = [];

  if (!readEnv("ADMIN_EMAIL")) missing.push("ADMIN_EMAIL");
  if (!readEnv("ADMIN_PASSWORD_HASH")) missing.push("ADMIN_PASSWORD_HASH");
  else {
    try {
      getAdminPasswordHash();
    } catch {
      missing.push("ADMIN_PASSWORD_HASH (formato inválido)");
    }
  }

  const secret = readEnv("AUTH_SECRET");
  if (!secret || secret.length < 32) missing.push("AUTH_SECRET (mín. 32 caracteres)");

  if (!readEnv("DATABASE_URL")) missing.push("DATABASE_URL");

  if (missing.length > 0) return { ok: false, missing };
  return { ok: true };
}
