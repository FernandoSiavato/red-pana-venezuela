// Verificación simple de admin para los endpoints de /insumos-ai.
// El cliente manda la contraseña en el header "x-pana-admin".
import { NextResponse } from "next/server";

export function checkAdmin(req: Request): NextResponse | null {
  const pass = process.env.ADMIN_PASSWORD;
  const sent =
    req.headers.get("x-pana-admin") ||
    new URL(req.url).searchParams.get("key") ||
    "";
  if (!pass || pass === "PENDIENTE") {
    return NextResponse.json(
      { error: "El panel admin no está configurado (falta ADMIN_PASSWORD)." },
      { status: 503 }
    );
  }
  if (sent !== pass) {
    return NextResponse.json({ error: "Contraseña incorrecta." }, { status: 401 });
  }
  return null; // ok
}
