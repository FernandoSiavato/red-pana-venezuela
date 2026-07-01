import { getInsumos } from "@/lib/data";
import { esTerminal } from "@/lib/types";
import { jsonPublic, corsOptions, tooMany } from "@/lib/apiPublic";
import { rateLimit, rateHeaders } from "@/lib/rateLimit";
import { buscarInsumos, sugerencias } from "@/lib/buscar";

export const revalidate = 30; // cachea 30s

// GET /api/insumos  — público, solo lectura.
// Filtros opcionales por query: ?tipo=SOLICITUD&urgencia=alta&estado=Pendiente&zona=catia&q=agua&activos=1
export async function GET(req: Request) {
  const rl = rateLimit(req);
  if (!rl.ok) return tooMany(rateHeaders(rl));
  const { searchParams } = new URL(req.url);
  const tipo = searchParams.get("tipo");
  const urgencia = searchParams.get("urgencia");
  const estado = searchParams.get("estado");
  const zona = searchParams.get("zona")?.toLowerCase();
  const q = searchParams.get("q")?.trim();
  const activos = searchParams.get("activos") === "1";

  let data = await getInsumos();
  if (activos) data = data.filter((i) => !esTerminal(i.estado));
  if (tipo) data = data.filter((i) => (i.tipo ?? "").toUpperCase() === tipo.toUpperCase());
  if (urgencia) data = data.filter((i) => (i.urgencia ?? "").toLowerCase() === urgencia.toLowerCase());
  if (estado) data = data.filter((i) => (i.estado ?? "").toLowerCase() === estado.toLowerCase());
  if (zona) data = data.filter((i) => (i.zona ?? "").toLowerCase().includes(zona));

  // Búsqueda con relevancia (acentos, multipalabra, sinónimos, ranking)
  if (q) {
    const rankeados = buscarInsumos(data, q);
    if (rankeados.length === 0) {
      return jsonPublic(
        { count: 0, insumos: [], sugerencias: sugerencias(data) },
        rateHeaders(rl)
      );
    }
    return jsonPublic({ count: rankeados.length, insumos: rankeados }, rateHeaders(rl));
  }

  return jsonPublic({ count: data.length, insumos: data }, rateHeaders(rl));
}

export async function OPTIONS() {
  return corsOptions();
}
