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
const ESTADOS_INSUMO = ["Pendiente", "Activo", "En proceso", "Listo", "Completado", "Cancelado"];

// Actualiza un registro existente por id (ej. cambiar estado desde Telegram).
// Body: { destino, id, estado?, ...otrosCampos }
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

  // Campos actualizables permitidos (solo los presentes en el body)
  const permitidos = [
    "estado", "notas", "cantidad", "urgencia", "zona", "contacto",
    "responsable", "ocupacion", "capacidad", "necesidades", "foto_url",
  ];
  const cambios: Record<string, unknown> = {};
  for (const k of permitidos) {
    if (body[k] !== undefined && body[k] !== null && body[k] !== "") cambios[k] = body[k];
  }
  // Normaliza estado de insumo
  if (destino === "insumo" && typeof cambios.estado === "string") {
    const e = cambios.estado.trim();
    const match = ESTADOS_INSUMO.find((x) => x.toLowerCase() === e.toLowerCase());
    if (match) cambios.estado = match;
  }
  if (Object.keys(cambios).length === 0) {
    return NextResponse.json({ error: "No hay campos para actualizar." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin()
    .from(cfg.tabla)
    .update(cambios)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "No se encontró el registro." }, { status: 404 });

  revalidatePath(cfg.path);
  revalidatePath("/");
  return NextResponse.json({ ok: true, destino, registro: data });
}
