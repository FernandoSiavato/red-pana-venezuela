import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { guardarInsumo } from "@/lib/insumosAI";
import { guardarAlbergue } from "@/lib/albergues";
import { guardarPagina } from "@/lib/paginas";

export const runtime = "nodejs";

// Carga estructurada para AGENTES → escribe directo en Supabase.
// Clave admin por: header "x-pana-admin", query "?key=" o body { "key": ... }.
// Body: { "destino": "insumo" | "albergue", ...campos }  (o "ignorar" para descartar)
export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido (envía JSON)." }, { status: 400 });
  }

  // --- Auth flexible ---
  const pass = process.env.ADMIN_PASSWORD;
  const sent =
    req.headers.get("x-pana-admin") ||
    new URL(req.url).searchParams.get("key") ||
    (typeof body.key === "string" ? body.key : "");
  if (!pass || pass === "PENDIENTE") {
    return NextResponse.json({ error: "No configurado." }, { status: 503 });
  }
  if (sent !== pass) {
    return NextResponse.json({ error: "Clave incorrecta." }, { status: 401 });
  }

  const destino = String(body.destino ?? "").toLowerCase();

  try {
    if (destino === "ignorar") {
      return NextResponse.json({ ok: true, ignorado: true });
    }
    if (destino === "insumo" || destino === "insumos") {
      const insumo = await guardarInsumo(body);
      revalidatePath("/insumos");
      revalidatePath("/");
      return NextResponse.json({ ok: true, destino: "insumo", registro: insumo });
    }
    if (destino === "albergue" || destino === "albergues") {
      const albergue = await guardarAlbergue(body);
      revalidatePath("/albergues");
      revalidatePath("/");
      return NextResponse.json({ ok: true, destino: "albergue", registro: albergue });
    }
    if (destino === "pagina" || destino === "paginas" || destino === "página") {
      const pagina = await guardarPagina(body);
      revalidatePath("/paginas");
      revalidatePath("/");
      return NextResponse.json({ ok: true, destino: "pagina", registro: pagina });
    }
    return NextResponse.json(
      { error: "Falta 'destino' válido: insumo | albergue | pagina | ignorar." },
      { status: 400 }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error guardando.";
    const status = msg.includes("obligatorio") ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
