import { getPaginas } from "@/lib/data";
import { jsonPublic, corsOptions, tooMany } from "@/lib/apiPublic";
import { rateLimit, rateHeaders } from "@/lib/rateLimit";

export const revalidate = 30;

// GET /api/paginas — público, solo lectura. Filtro: ?categoria=donaciones&q=...
export async function GET(req: Request) {
  const rl = rateLimit(req);
  if (!rl.ok) return tooMany(rateHeaders(rl));
  const { searchParams } = new URL(req.url);
  const categoria = searchParams.get("categoria")?.toLowerCase();
  const q = searchParams.get("q")?.toLowerCase();

  let data = await getPaginas();
  if (categoria) data = data.filter((p) => (p.categoria ?? "").toLowerCase() === categoria);
  if (q)
    data = data.filter((p) =>
      [p.titulo, p.descripcion, p.categoria, p.url].filter(Boolean).join(" ").toLowerCase().includes(q)
    );

  return jsonPublic({ count: data.length, paginas: data }, rateHeaders(rl));
}

export async function OPTIONS() {
  return corsOptions();
}
