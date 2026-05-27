import { prisma } from "@/lib/prisma";
import { DEFAULT_USER_EMAIL } from "@/lib/constants";

export async function getCurrentUser() {
  return prisma.user.upsert({
    where: { email: DEFAULT_USER_EMAIL },
    update: {},
    create: {
      email: DEFAULT_USER_EMAIL,
      name: "Administrador",
    },
  });
}
