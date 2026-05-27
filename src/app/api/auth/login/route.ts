import { NextResponse } from "next/server";
import { getAdminEmail, verifyAdminPassword } from "@/lib/credentials";
import { createSessionToken, setSessionCookie } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "E-mail e senha são obrigatórios." },
        { status: 400 },
      );
    }

    const adminEmail = getAdminEmail();

    if (email !== adminEmail || !(await verifyAdminPassword(password))) {
      return NextResponse.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
    }

    await prisma.user.upsert({
      where: { email: adminEmail },
      update: { name: "Administrador" },
      create: { email: adminEmail, name: "Administrador" },
    });

    const token = await createSessionToken(adminEmail);
    await setSessionCookie(token);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Configuração de autenticação inválida no servidor." },
      { status: 500 },
    );
  }
}
