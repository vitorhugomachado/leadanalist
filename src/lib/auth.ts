import { getSessionEmail } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  return requireAuthUser();
}

export async function requireAuthUser() {
  const email = process.env.ADMIN_EMAIL || "vitor-hugo710@hotmail.com";

  return prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "Administrador",
    },
  });
}
