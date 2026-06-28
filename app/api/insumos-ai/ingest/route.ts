import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { extraerInsumo, guardarInsumo } from "@/lib/insumosAI";

export const runtime = "nodejs";

// Ingesta directa: { texto } → OpenAI extrae → guarda en Supabase, todo en un POST.
// Para automatizar (n8n, scripts, formularios, WhatsApp).
// La clave admin se acepta por: header "x-pana-admin", query "?key=", o body { "key": ... }.
// Si la IA marca accion="ignorar", no guarda (devuelve ignorado:true).
export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido (envía JSON)." }, { status: 400 });
  }

  // --- Auth flexible ---
  const pass = process.env.ADMIN_PASSWORD;
  const url = new URL(req.url);
  const sent =
    req.headers.get("x-pana-admin") ||
    url.searchParams.get("key") ||
    (typeof body.key === "string" ? body.key : "");
  if (!pass || pass === "PENDIENTE") {
    return NextResponse.json({ error: "Panel no configurado." }, { status: 503 });
  }
  if (sent !== pass) {
    return NextResponse.json({ error: "Clave incorrecta." }, { status: 401 });
  }

  const texto = typeof body.texto === "string" ? body.texto : "";
  if (!texto.trim()) {
    return NextResponse.json({ error: "Falta 'texto'." }, { status: 400 });
  }

  try {
    const extraido = await extraerInsumo(texto);
    if (extraido.accion === "ignorar") {
      return NextResponse.json({ ok: true, ignorado: true, alertas: extraido.alertas });
    }
    const insumo = await guardarInsumo({ ...extraido, mensaje_original: texto });
    revalidatePath("/insumos");
    revalidatePath("/");
    return NextResponse.json({ ok: true, insumo, alertas: extraido.alertas });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error en la ingesta.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
