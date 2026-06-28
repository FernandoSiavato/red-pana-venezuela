import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin";
import { extraer, type Destino } from "@/lib/agente";

export const runtime = "nodejs";

const DESTINOS = ["insumo", "albergue", "pagina"];

// { destino, texto } → IA (gpt-4.1-mini) → campos estructurados + alertas.
// NO guarda. n8n lo muestra para confirmar y luego llama a /api/ingest.
export async function POST(req: Request) {
  const denied = checkAdmin(req);
  if (denied) return denied;

  let body: { destino?: string; texto?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const destino = String(body.destino ?? "").toLowerCase().replace(/s$/, "");
  const texto = (body.texto ?? "").trim();
  if (!DESTINOS.includes(destino)) {
    return NextResponse.json(
      { error: "destino inválido (insumo | albergue | pagina)." },
      { status: 400 }
    );
  }
  if (!texto) return NextResponse.json({ error: "Falta 'texto'." }, { status: 400 });

  try {
    const campos = await extraer(destino as Destino, texto);
    return NextResponse.json(campos);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error procesando.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
