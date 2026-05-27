import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "../src/generated/prisma/client";

config({ path: ".env.local" });
config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL missing");

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!email) {
    console.warn("ADMIN_EMAIL não definido — seed de usuário ignorado.");
    return;
  }

  await prisma.user.upsert({
    where: { email },
    update: { name: "Administrador" },
    create: { email, name: "Administrador" },
  });

  console.log(`Usuário admin garantido: ${email}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
