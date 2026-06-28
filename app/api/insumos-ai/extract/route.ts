import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin";
import { extraerInsumo } from "@/lib/insumosAI";

export const runtime = "nodejs";

// { texto } → OpenAI lo procesa → devuelve el JSON del insumo (NO guarda; eso es /publish).
export async function POST(req: Request) {
  const denied = checkAdmin(req);
  if (denied) return denied;

  let texto = "";
  try {
    ({ texto } = await req.json());
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }
  if (!texto || !texto.trim()) {
    return NextResponse.json({ error: "Pega un mensaje primero." }, { status: 400 });
  }

  try {
    return NextResponse.json(await extraerInsumo(texto));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error procesando.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
