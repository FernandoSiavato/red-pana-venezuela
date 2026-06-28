import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { checkAdmin } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

const TABLAS: Record<string, { tabla: string; path: string }> = {
  insumo: { tabla: "insumos", path: "/insumos" },
  albergue: { tabla: "albergues", path: "/albergues" },
  pagina: { tabla: "paginas", path: "/paginas" },
};

// Borra un registro por id (ej. botón ❌ Descartar en Telegram). Admin.
export async function POST(req: Request) {
  const denied = checkAdmin(req);
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }
  const destino = String(body.destino ?? "").toLowerCase().replace(/s$/, "");
  const cfg = TABLAS[destino];
  if (!cfg) {
    return NextResponse.json({ error: "destino inválido (insumo|albergue|pagina)." }, { status: 400 });
  }
  const id = Number(body.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Falta 'id' válido." }, { status: 400 });
  }

  const { error } = await supabaseAdmin().from(cfg.tabla).delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath(cfg.path);
  revalidatePath("/");
  return NextResponse.json({ ok: true, destino, id });
}
