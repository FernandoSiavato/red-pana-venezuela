import { getAlbergues } from "@/lib/data";
import { jsonPublic, corsOptions, tooMany } from "@/lib/apiPublic";
import { rateLimit, rateHeaders } from "@/lib/rateLimit";

export const revalidate = 30;

// GET /api/albergues — público, solo lectura. Filtros: ?estado=operativo&zona=caricuao
export async function GET(req: Request) {
  const rl = rateLimit(req);
  if (!rl.ok) return tooMany(rateHeaders(rl));
  const { searchParams } = new URL(req.url);
  const estado = searchParams.get("estado")?.toLowerCase();
  const zona = searchParams.get("zona")?.toLowerCase();

  let data = await getAlbergues();
  if (estado) data = data.filter((a) => (a.estado ?? "").toLowerCase() === estado);
  if (zona)
    data = data.filter((a) =>
      [a.zona, a.municipio, a.direccion].filter(Boolean).join(" ").toLowerCase().includes(zona)
    );

  return jsonPublic({ count: data.length, albergues: data }, rateHeaders(rl));
}

export async function OPTIONS() {
  return corsOptions();
}
