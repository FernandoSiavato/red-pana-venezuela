import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin";
import { subirFotoDesdeUrl, subirFotoBuffer } from "@/lib/storage";

export const runtime = "nodejs";

// Sube una foto a Supabase Storage y devuelve { foto_url }.
// Acepta JSON { url } (file_url de Telegram) o multipart con campo "file".
export async function POST(req: Request) {
  const denied = checkAdmin(req);
  if (denied) return denied;

  const ct = req.headers.get("content-type") || "";
  try {
    if (ct.includes("application/json")) {
      const { url } = await req.json();
      if (!url) return NextResponse.json({ error: "Falta 'url'." }, { status: 400 });
      return NextResponse.json({ foto_url: await subirFotoDesdeUrl(String(url)) });
    }
    if (ct.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "Falta el archivo 'file'." }, { status: 400 });
      }
      const buf = Buffer.from(await file.arrayBuffer());
      return NextResponse.json({
        foto_url: await subirFotoBuffer(buf, file.type || "image/jpeg"),
      });
    }
    return NextResponse.json({ error: "Envía JSON { url } o multipart 'file'." }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error subiendo la imagen.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
