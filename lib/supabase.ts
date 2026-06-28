import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Cliente público (lectura). La anon/publishable key es pública: ok en cliente y servidor. */
export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
});

/**
 * Cliente admin (escritura). Usa la service role — SOLO en el servidor
 * (route handlers / server actions). NUNCA importar desde un componente "use client".
 */
export function supabaseAdmin() {
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE;
  if (!serviceRole || serviceRole === "PENDIENTE") {
    throw new Error("Falta SUPABASE_SERVICE_ROLE en el entorno del servidor.");
  }
  return createClient(url, serviceRole, { auth: { persistSession: false } });
}
