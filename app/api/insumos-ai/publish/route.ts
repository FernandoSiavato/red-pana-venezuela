import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { checkAdmin } from "@/lib/admin";
import { guardarInsumo } from "@/lib/insumosAI";

export const runtime = "nodejs";

// Guarda un insumo (campos ya revisados) en Supabase.
export async function POST(req: Request) {
  const denied = checkAdmin(req);
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  try {
    const insumo = await guardarInsumo(body);
    revalidatePath("/insumos");
    revalidatePath("/");
    return NextResponse.json({ ok: true, insumo });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error guardando.";
    const status = msg.includes("obligatorio") ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
