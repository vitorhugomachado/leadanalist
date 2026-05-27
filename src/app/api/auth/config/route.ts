import { NextResponse } from "next/server";
import { validateAuthEnv } from "@/lib/credentials";

export const dynamic = "force-dynamic";

/** Diagnóstico rápido (não expõe valores secretos). */
export async function GET() {
  const check = validateAuthEnv();
  if (check.ok) {
    return NextResponse.json({ ok: true, message: "Autenticação configurada." });
  }
  return NextResponse.json(
    { ok: false, missing: check.missing },
    { status: 503 },
  );
}
