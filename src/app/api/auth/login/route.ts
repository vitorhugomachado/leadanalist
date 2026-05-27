import { NextResponse } from "next/server";
import { getAdminEmail, validateAuthEnv, verifyAdminPassword } from "@/lib/credentials";
import { createSessionToken, setSessionCookie } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function configErrorResponse(missing: string[]) {
  return NextResponse.json(
    {
      error:
        "Configuração incompleta no servidor. Defina no Vercel/.env: " +
        missing.join(", "),
      missing,
    },
    { status: 503 },
  );
}

export async function POST(request: Request) {
  const envCheck = validateAuthEnv();
  if (!envCheck.ok) {
    return configErrorResponse(envCheck.missing);
  }

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

    try {
      await prisma.user.upsert({
        where: { email: adminEmail },
        update: { name: "Administrador" },
        create: { email: adminEmail, name: "Administrador" },
      });
    } catch (dbError) {
      console.error("Login DB error:", dbError);
      return NextResponse.json(
        {
          error:
            "Não foi possível conectar ao banco. Verifique DATABASE_URL no servidor.",
        },
        { status: 503 },
      );
    }

    const token = await createSessionToken(adminEmail);
    await setSessionCookie(token);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Login error:", e);
    const code = e instanceof Error ? e.message : "UNKNOWN";
    const hint =
      code === "AUTH_SECRET"
        ? "AUTH_SECRET ausente ou com menos de 32 caracteres."
        : code === "ADMIN_EMAIL"
          ? "ADMIN_EMAIL não configurado."
          : code === "ADMIN_PASSWORD_HASH" || code === "ADMIN_PASSWORD_HASH_INVALID"
            ? "ADMIN_PASSWORD_HASH inválido. Use o hash completo do bcrypt (começa com $2b$)."
            : "Erro interno ao processar login.";

    return NextResponse.json({ error: hint, code }, { status: 500 });
  }
}
