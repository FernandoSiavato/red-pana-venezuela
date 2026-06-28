// Guardado de albergues en Supabase (service role).
import "server-only";
import { supabaseAdmin } from "./supabase";

export async function guardarAlbergue(
  campos: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const str = (k: string) => {
    const v = campos[k];
    return v === undefined || v === null || v === "" ? null : String(v).trim();
  };
  const num = (k: string) => {
    const v = campos[k];
    if (v === undefined || v === null || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : null;
  };

  const nombre = str("nombre");
  if (!nombre) throw new Error("El campo 'nombre' es obligatorio.");

  const fila = {
    nombre,
    zona: str("zona"),
    municipio: str("municipio"),
    estado_geo: str("estado_geo"),
    direccion: str("direccion"),
    plus_code: str("plus_code"),
    tipo: str("tipo"),
    responsable: str("responsable"),
    contacto: str("contacto"),
    capacidad: num("capacidad"),
    ocupacion: num("ocupacion"),
    servicios: str("servicios"),
    necesidades: str("necesidades"),
    estado: str("estado"),
    notas: str("notas"),
    foto_url: str("foto_url"),
  };

  const { data, error } = await supabaseAdmin()
    .from("albergues")
    .insert(fila)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Record<string, unknown>;
}
