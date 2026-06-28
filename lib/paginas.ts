// Guardado de páginas web en Supabase (service role).
import "server-only";
import { supabaseAdmin } from "./supabase";

export async function guardarPagina(
  campos: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const str = (k: string) => {
    const v = campos[k];
    return v === undefined || v === null || v === "" ? null : String(v).trim();
  };

  const url = str("url");
  if (!url) throw new Error("El campo 'url' es obligatorio.");

  // titulo es NOT NULL: si falta, deriva del host de la URL.
  let titulo = str("titulo");
  if (!titulo) {
    try {
      titulo = new URL(url).hostname.replace(/^www\./, "");
    } catch {
      titulo = url;
    }
  }

  const verificacion = str("verificacion") ?? "sin_verificar";

  const fila = {
    url,
    titulo,
    descripcion: str("descripcion"),
    categoria: str("categoria"),
    tipo: str("tipo") ?? "web",
    verificacion,
    activa: true,
  };

  const { data, error } = await supabaseAdmin()
    .from("paginas")
    .insert(fila)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Record<string, unknown>;
}
