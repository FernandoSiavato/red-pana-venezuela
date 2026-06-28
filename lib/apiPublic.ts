import { NextResponse } from "next/server";

// Respuesta JSON pública (solo lectura) con CORS abierto, para consumir desde
// cualquier sitio/herramienta. La data es pública (mismos datos que la app).
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function jsonPublic(data: unknown, extra: Record<string, string> = {}) {
  return NextResponse.json(data, { headers: { ...CORS, ...extra } });
}

export function corsOptions() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export function tooMany(extra: Record<string, string> = {}) {
  return NextResponse.json(
    { error: "Demasiadas consultas. Espera unos segundos e intenta de nuevo." },
    { status: 429, headers: { ...CORS, ...extra } }
  );
}
