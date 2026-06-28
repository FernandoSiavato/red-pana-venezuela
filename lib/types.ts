// Modelo de datos de Red Pana Venezuela.
// Espejo de los módulos locales (insumos / albergues / páginas).
// Hoy se llena desde data/*.json; mañana desde Supabase, sin tocar la UI.

export type TipoInsumo = "SOLICITUD" | "INSUMOS" | "AVISO" | "INSUMO+SOLICITUD";

export interface Insumo {
  id: number;
  tipo: TipoInsumo | string;
  insumo: string;
  categoria: string | null;
  cantidad: string | null;
  urgencia: "alta" | "media" | "baja" | string | null;
  solicitante: string | null;
  responsable: string | null;
  zona: string | null;
  contacto: string | null;
  estado: string | null;
  notas: string | null;
  mensaje_original: string | null;
  foto_url: string | null;
  fecha_registro: string | null;
  updated_at: string | null;
}

export interface Albergue {
  id: number;
  nombre: string;
  zona: string | null;
  municipio: string | null;
  estado_geo: string | null;
  direccion: string | null;
  plus_code: string | null;
  tipo: string | null;
  responsable: string | null;
  contacto: string | null;
  capacidad: number | null;
  ocupacion: number | null;
  servicios: string | null;
  necesidades: string | null;
  estado: string | null;
  notas: string | null;
  foto_url: string | null;
  updated_at: string | null;
}

export interface Pagina {
  id: number;
  url: string;
  titulo: string;
  descripcion: string | null;
  categoria: string | null;
  tipo: string | null;
  verificacion: "verificada" | "sin_verificar" | string | null;
  activa: number | boolean | null;
  veces_compartida: number | null;
}

// ---- Helpers de presentación (compartidos UI) ----

const TERMINALES = [
  "completado",
  "listo",
  "entregado",
  "cancelado",
  "resuelto",
  "cerrado",
];

/** ¿Este insumo ya se resolvió/cerró? (para ocultarlo por defecto) */
export function esTerminal(estado: string | null | undefined): boolean {
  if (!estado) return false;
  return TERMINALES.includes(estado.trim().toLowerCase());
}

/** Etiqueta y color para el tipo de insumo. */
export function tipoInsumoMeta(tipo: string): {
  label: string;
  emoji: string;
  clase: string;
} {
  switch (tipo) {
    case "SOLICITUD":
      return { label: "Se necesita", emoji: "⭕️", clase: "bg-pana-rojo/10 text-pana-rojo" };
    case "INSUMOS":
      return { label: "Disponible", emoji: "❇️", clase: "bg-pana-verde/10 text-pana-verde" };
    case "INSUMO+SOLICITUD":
      return { label: "Pide y ofrece", emoji: "🔁", clase: "bg-pana-azul/10 text-pana-azul" };
    case "AVISO":
      return { label: "Aviso", emoji: "⚠️", clase: "bg-pana-amarillo/20 text-[#92400e]" };
    default:
      return { label: tipo, emoji: "•", clase: "bg-gray-100 text-tinta-suave" };
  }
}

/** Normaliza un teléfono venezolano a formato internacional para wa.me/tel. */
export function normalizarTelefono(raw: string | null | undefined): string | null {
  if (!raw) return null;
  // toma el primer número que aparezca
  const m = raw.replace(/[^\d+]/g, " ").match(/\+?\d[\d ]{6,}/);
  if (!m) return null;
  let n = m[0].replace(/\s/g, "");
  if (n.startsWith("+")) return n.slice(1);
  if (n.startsWith("58")) return n;
  if (n.startsWith("0")) return "58" + n.slice(1);
  return "58" + n;
}

/** URL de Google Maps para "Cómo llegar". */
export function urlMaps(a: Pick<Albergue, "nombre" | "direccion" | "zona" | "plus_code">): string {
  const partes = [a.plus_code, a.direccion, a.zona, a.nombre, "Venezuela"].filter(Boolean);
  const q = encodeURIComponent(partes.join(", "));
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

/** Fecha legible en hora de Venezuela (ej. "28/06/2026, 10:37 a. m."). */
export function fechaLegible(s: string | null | undefined): string | null {
  if (!s) return null;
  // acepta "2026-06-27 15:38:15" o ISO; trátalo como UTC si no trae zona
  const iso = s.includes("T") ? s : s.replace(" ", "T") + (/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? "" : "Z");
  const d = new Date(iso);
  if (isNaN(d.getTime())) return s;
  try {
    return d.toLocaleString("es-VE", {
      timeZone: "America/Caracas",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return d.toLocaleString();
  }
}

/** Cupos libres (o null si no se reportó capacidad). */
export function cuposLibres(a: Albergue): number | null {
  if (!a.capacidad || a.capacidad <= 0) return null;
  return Math.max(0, a.capacidad - (a.ocupacion ?? 0));
}
