import bcrypt from "bcryptjs";

export function getAdminEmail(): string {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!email) {
    throw new Error("ADMIN_EMAIL não configurado.");
  }
  return email;
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) {
    throw new Error("ADMIN_PASSWORD_HASH não configurado.");
  }
  return bcrypt.compare(password, hash);
}
