// Resumen de "reportes de necesidad" (solicitudes) por zona y por categoría.
// Live: se calcula desde los insumos que vienen de Supabase.
import type { Insumo } from "./types";
import { esTerminal } from "./types";
import { geocodeZona } from "./zonas";

export type RegionKey = "oeste" | "este" | "miranda" | "guaira";

export const REGIONS: { key: RegionKey; label: string }[] = [
  { key: "oeste", label: "Caracas Oeste / Centro" },
  { key: "miranda", label: "Miranda / Otros" },
  { key: "este", label: "Caracas Este / Sureste" },
  { key: "guaira", label: "La Guaira / Litoral" },
];

/** Clasifica una zona en una de las 4 regiones (por coordenadas aproximadas). */
export function regionDe(zona: string | null | undefined): RegionKey {
  const co = geocodeZona(zona);
  if (!co) return "miranda";
  const [lat, lng] = co;
  if (lng > -66.75 || lng < -67.15) return "miranda"; // Guarenas/Guatire/Valencia, etc.
  if (lat >= 10.55) return "guaira"; // litoral
  if (lng <= -66.885) return "oeste";
  return "este";
}

export type GrupoKey =
  | "alimentos_agua"
  | "refugio_abrigo"
  | "salud"
  | "logistica_rescate"
  | "otros";

export const GRUPOS: { key: GrupoKey; label: string; cats: string[] }[] = [
  { key: "alimentos_agua", label: "Alimentos y agua", cats: ["alimentos", "agua"] },
  { key: "refugio_abrigo", label: "Refugio y abrigo", cats: ["refugio", "ropa"] },
  { key: "salud", label: "Salud y medicinas", cats: ["medico", "equipo_medico", "higiene"] },
  {
    key: "logistica_rescate",
    label: "Logística y rescate",
    cats: ["logistica", "coordinacion", "transporte", "voluntariado", "herramientas", "equipo_proteccion"],
  },
  { key: "otros", label: "Otros", cats: [] },
];

export function grupoDe(categoria: string | null | undefined): GrupoKey {
  const c = (categoria ?? "").toLowerCase();
  for (const g of GRUPOS) if (g.cats.includes(c)) return g.key;
  return "otros";
}

export function labelRegion(key: string): string {
  return REGIONS.find((r) => r.key === key)?.label ?? key;
}
export function labelGrupo(key: string): string {
  return GRUPOS.find((g) => g.key === key)?.label ?? key;
}

/** Solo solicitudes activas (lo que se necesita, sin resolver). */
export function reportesActivos(insumos: Insumo[]): Insumo[] {
  return insumos.filter(
    (i) => (i.tipo === "SOLICITUD" || i.tipo === "INSUMO+SOLICITUD") && !esTerminal(i.estado)
  );
}

export interface ResumenReportes {
  total: number;
  zonas: { key: RegionKey; label: string; count: number }[];
  categorias: { key: GrupoKey; label: string; count: number }[];
}

export function resumenReportes(insumos: Insumo[]): ResumenReportes {
  const activos = reportesActivos(insumos);
  const total = activos.length;

  const zonas = REGIONS.map((r) => ({
    ...r,
    count: activos.filter((i) => regionDe(i.zona) === r.key).length,
  }));

  const conteo: Record<string, number> = {};
  for (const i of activos) {
    const g = grupoDe(i.categoria);
    conteo[g] = (conteo[g] ?? 0) + 1;
  }
  const categorias = GRUPOS.map((g) => ({ key: g.key, label: g.label, count: conteo[g.key] ?? 0 }))
    .filter((g) => g.count > 0)
    .sort((a, b) => b.count - a.count);

  return { total, zonas, categorias };
}
