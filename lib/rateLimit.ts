// Rate limiting sencillo en memoria (por IP, ventana fija).
// Evita que un solo visitante sature la API pública. NOTA: el contador vive por
// instancia serverless (no es global perfecto), pero combinado con el caché de 30s
// es un límite "sano" suficiente para datos públicos. Para un límite global estricto
// se usaría Upstash Redis / Vercel KV con @upstash/ratelimit.

type Hit = { count: number; reset: number };
const store = new Map<string, Hit>();

export type RateResult = {
  ok: boolean;
  limit: number;
  remaining: number;
  reset: number; // epoch segundos
  retryAfter: number; // segundos
};

export function rateLimit(req: Request, limit = 60, windowMs = 60_000): RateResult {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const now = Date.now();
  let hit = store.get(ip);
  if (!hit || hit.reset <= now) {
    hit = { count: 0, reset: now + windowMs };
    store.set(ip, hit);
  }
  hit.count++;

  // limpieza ligera de entradas viejas
  if (store.size > 5000) {
    for (const [k, v] of store) if (v.reset <= now) store.delete(k);
  }

  const remaining = Math.max(0, limit - hit.count);
  const resetSec = Math.ceil(hit.reset / 1000);
  return {
    ok: hit.count <= limit,
    limit,
    remaining,
    reset: resetSec,
    retryAfter: Math.max(1, Math.ceil((hit.reset - now) / 1000)),
  };
}

/** Cabeceras estándar de rate limit para añadir a la respuesta. */
export function rateHeaders(r: RateResult): Record<string, string> {
  const h: Record<string, string> = {
    "X-RateLimit-Limit": String(r.limit),
    "X-RateLimit-Remaining": String(r.remaining),
    "X-RateLimit-Reset": String(r.reset),
  };
  if (!r.ok) h["Retry-After"] = String(r.retryAfter);
  return h;
}
