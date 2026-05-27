import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();
const DEFAULT_USER_EMAIL = "admin@leadanalist.local";

async function main() {
  await prisma.user.upsert({
    where: { email: DEFAULT_USER_EMAIL },
    update: {},
    create: { email: DEFAULT_USER_EMAIL, name: "Administrador" },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
