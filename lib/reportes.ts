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

// ---- Reportes por día (hora de Venezuela) ----

const FMT_DIA = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Caracas",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Devuelve el día (YYYY-MM-DD, hora Caracas) de una fecha, o null. */
export function diaCaracas(s: string | null | undefined): string | null {
  if (!s) return null;
  const iso = s.includes("T")
    ? s
    : s.replace(" ", "T") + (/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? "" : "Z");
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return FMT_DIA.format(d);
}

/** Etiqueta amigable para un día YYYY-MM-DD (Hoy / Ayer / dd/mm). */
export function labelDia(dia: string): string {
  const hoy = FMT_DIA.format(new Date());
  const ayer = FMT_DIA.format(new Date(Date.now() - 86_400_000));
  if (dia === hoy) return "Hoy";
  if (dia === ayer) return "Ayer";
  const [, m, dd] = dia.split("-");
  return `${dd}/${m}`;
}

export interface DiaReporte {
  dia: string;
  label: string;
  count: number;
  esHoy: boolean;
}

/** Cuenta solicitudes por día (todas las que llegaron, ordenadas de más reciente a más viejo). */
export function reportesPorDia(insumos: Insumo[], dias = 7): DiaReporte[] {
  const sol = insumos.filter(
    (i) => i.tipo === "SOLICITUD" || i.tipo === "INSUMO+SOLICITUD"
  );
  const conteo: Record<string, number> = {};
  for (const i of sol) {
    const d = diaCaracas(i.fecha_registro);
    if (!d) continue;
    conteo[d] = (conteo[d] ?? 0) + 1;
  }
  const hoy = FMT_DIA.format(new Date());
  const ayer = FMT_DIA.format(new Date(Date.now() - 86_400_000));
  return Object.keys(conteo)
    .sort()
    .reverse()
    .slice(0, dias)
    .map((d) => {
      const [, m, dd] = d.split("-");
      const label = d === hoy ? "Hoy" : d === ayer ? "Ayer" : `${dd}/${m}`;
      return { dia: d, label, count: conteo[d], esHoy: d === hoy };
    });
}

/** Solo solicitudes activas (lo que se necesita, sin resolver). */
export function reportesActivos(insumos: Insumo[]): Insumo[] {
  return insumos.filter(
    (i) => (i.tipo === "SOLICITUD" || i.tipo === "INSUMO+SOLICITUD") && !esTerminal(i.estado)
  );
}

export interface ResumenReportes {
  total: number;
  hoy: number;
  zonas: { key: RegionKey; label: string; count: number }[];
  categorias: { key: GrupoKey; label: string; count: number }[];
  porDia: DiaReporte[];
}

export function resumenReportes(insumos: Insumo[]): ResumenReportes {
  const activos = reportesActivos(insumos);
  const total = activos.length;
  const porDia = reportesPorDia(insumos, 7);
  const hoy = porDia.find((d) => d.esHoy)?.count ?? 0;

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

  return { total, hoy, zonas, categorias, porDia };
}

// ---- Vistas del reporte: Hoy / Ayer / General ----

export interface Vista {
  total: number;
  zonas: { key: RegionKey; label: string; count: number }[];
  categorias: { key: GrupoKey; label: string; count: number }[];
}

export interface ResumenVistas {
  general: Vista;
  hoy: Vista;
  ayer: Vista;
  hoyStr: string;
  ayerStr: string;
}

function vistaDe(activos: Insumo[]): Vista {
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

/** Tres vistas del reporte (todas sobre solicitudes activas), para el toggle Hoy/Ayer/General. */
export function resumenVistas(insumos: Insumo[]): ResumenVistas {
  const activos = reportesActivos(insumos);
  const hoyStr = FMT_DIA.format(new Date());
  const ayerStr = FMT_DIA.format(new Date(Date.now() - 86_400_000));
  return {
    general: vistaDe(activos),
    hoy: vistaDe(activos.filter((i) => diaCaracas(i.fecha_registro) === hoyStr)),
    ayer: vistaDe(activos.filter((i) => diaCaracas(i.fecha_registro) === ayerStr)),
    hoyStr,
    ayerStr,
  };
}
