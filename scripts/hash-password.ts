/**
 * Gera hash bcrypt para ADMIN_PASSWORD_HASH.
 * Uso: npx tsx scripts/hash-password.ts "sua-senha"
 */
import bcrypt from "bcryptjs";

const password = process.argv[2];
if (!password) {
  console.error("Uso: npx tsx scripts/hash-password.ts \"sua-senha\"");
  process.exit(1);
}

console.log(bcrypt.hashSync(password, 12));
