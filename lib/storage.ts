// Subida de fotos a Supabase Storage (bucket público "fotos").
import "server-only";
import { supabaseAdmin } from "./supabase";

const BUCKET = "fotos";

function nombre(ext: string) {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
}
function extDe(contentType: string) {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  return "jpg";
}

async function subir(buf: Buffer, contentType: string): Promise<string> {
  const db = supabaseAdmin();
  const file = nombre(extDe(contentType));
  const { error } = await db.storage
    .from(BUCKET)
    .upload(file, buf, { contentType, upsert: false });
  if (error) throw new Error(error.message);
  return db.storage.from(BUCKET).getPublicUrl(file).data.publicUrl;
}

/** Descarga una imagen desde una URL (ej. file_url de Telegram) y la sube. */
export async function subirFotoDesdeUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("No se pudo descargar la imagen.");
  const contentType = res.headers.get("content-type") || "image/jpeg";
  if (!contentType.startsWith("image/")) throw new Error("La URL no es una imagen.");
  const buf = Buffer.from(await res.arrayBuffer());
  return subir(buf, contentType);
}

/** Sube una imagen ya en memoria (multipart). */
export async function subirFotoBuffer(buf: Buffer, contentType: string): Promise<string> {
  return subir(buf, contentType || "image/jpeg");
}
