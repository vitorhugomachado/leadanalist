import { getSessionEmail } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  return requireAuthUser();
}

export async function requireAuthUser() {
  const email = await getSessionEmail();
  if (!email) {
    throw new Error("UNAUTHORIZED");
  }

  return prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "Administrador",
    },
  });
}
