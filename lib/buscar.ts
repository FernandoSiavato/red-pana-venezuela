// Motor de búsqueda/relevancia para insumos (JS/TS puro, sin dependencias).
// - Normaliza (minúsculas + sin acentos + trim)
// - Multipalabra AND sobre cualquier campo
// - Sinónimos humanitarios + alias de zonas
// - Singular/plural y raíces simples
// - Ranking por campo + urgencia + recencia
// - Tolerancia a typos ligera (edición <=1)
import type { Insumo } from "./types";

/** Minúsculas + quitar diacríticos + colapsar espacios. */
export function normalizar(s: string | null | undefined): string {
  return (s ?? "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ñ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Raíz simple para español: quita plurales y algunos sufijos comunes. */
export function raiz(tok: string): string {
  let t = tok;
  if (t.length > 4 && t.endsWith("es")) t = t.slice(0, -2);
  else if (t.length > 3 && t.endsWith("s")) t = t.slice(0, -1);
  if (t.length > 5 && (t.endsWith("cita") || t.endsWith("cito"))) t = t.slice(0, -4);
  return t;
}

// Diccionario de sinónimos (EDITABLE): amplíalo según el vocabulario de los grupos.
export const SINONIMOS: Record<string, string[]> = {
  agua: ["agua", "hidratacion", "potable", "botellon", "botellones"],
  alimentos: ["alimentos", "comida", "alimento", "mercado", "viveres", "enlatados", "comestibles"],
  medicina: ["medicina", "medicamento", "medicamentos", "farmaco", "farmacos", "remedio", "remedios", "pastillas", "tratamiento"],
  panal: ["panal", "panales", "pañal", "pañales"],
  colchoneta: ["colchoneta", "colchonetas", "colchon", "colchones", "cama", "camas"],
  ropa: ["ropa", "vestimenta", "abrigo", "abrigos", "cobija", "cobijas", "manta", "mantas", "franelas", "zapatos", "calzado"],
  higiene: ["higiene", "aseo", "jabon", "jabones", "toallas", "toallitas", "papel", "cepillo", "champu", "shampoo"],
  refugio: ["refugio", "albergue", "albergues", "carpa", "carpas", "toldo", "toldos"],
  medico: ["medico", "doctor", "doctora", "enfermera", "enfermero", "salud", "primeros auxilios"],
  bebe: ["bebe", "bebes", "infante", "recien nacido", "formula", "teteros"],
  transporte: ["transporte", "camion", "vehiculo", "gasolina", "flete", "traslado"],
  linterna: ["linterna", "linternas", "luz", "baterias", "pilas", "planta electrica", "generador"],
};

const INDICE_SINONIMOS: Record<string, string[]> = (() => {
  const idx: Record<string, string[]> = {};
  for (const variantes of Object.values(SINONIMOS)) {
    const norm = variantes.map(normalizar).filter(Boolean);
    for (const v of norm) idx[v] = norm;
  }
  return idx;
})();

export const ALIAS_ZONA: Record<string, string[]> = {
  guaira: ["guaira", "la guaira", "maiquetia", "litoral", "catia la mar"],
  petare: ["petare", "sucre"],
  catia: ["catia", "catia la mar"],
  caracas: ["caracas", "ccs", "distrito capital"],
};
const INDICE_ZONA: Record<string, string[]> = (() => {
  const idx: Record<string, string[]> = {};
  for (const vs of Object.values(ALIAS_ZONA)) {
    const norm = vs.map(normalizar);
    for (const v of norm) idx[v] = norm;
  }
  return idx;
})();

/** Distancia de edición acotada (>1 corta temprano). */
function edit1(a: string, b: string): boolean {
  if (a === b) return true;
  const la = a.length, lb = b.length;
  if (Math.abs(la - lb) > 1) return false;
  let i = 0, j = 0, dif = 0;
  while (i < la && j < lb) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++dif > 1) return false;
    if (la > lb) i++;
    else if (lb > la) j++;
    else { i++; j++; }
  }
  if (i < la || j < lb) dif++;
  return dif <= 1;
}

interface Termino {
  original: string;
  alternativas: string[];
}

export function parseQuery(q: string): Termino[] {
  const tokens = normalizar(q).split(" ").filter((t) => t.length >= 2);
  return tokens.map((tok) => {
    const set = new Set<string>([tok]);
    for (const s of INDICE_SINONIMOS[tok] ?? []) set.add(s);
    for (const z of INDICE_ZONA[tok] ?? []) set.add(z);
    const conRaiz = new Set<string>();
    for (const v of set) { conRaiz.add(v); conRaiz.add(raiz(v)); }
    return { original: tok, alternativas: [...conRaiz].filter(Boolean) };
  });
}

const PESOS: Record<string, number> = {
  insumo: 10, zona: 8, categoria: 6, solicitante: 3, responsable: 3, notas: 2, mensaje_original: 1,
};
const CAMPOS = Object.keys(PESOS);

function camposNorm(i: Insumo): Record<string, string> {
  const src = i as unknown as Record<string, string | null | undefined>;
  const out: Record<string, string> = {};
  for (const c of CAMPOS) out[c] = normalizar(src[c]);
  return out;
}

function pesoUrgencia(u: string | null | undefined): number {
  switch ((u ?? "").toLowerCase()) {
    case "alta": return 3;
    case "media": return 1.5;
    case "baja": return 0.5;
    default: return 1;
  }
}

function scoreTerminoCampo(term: Termino, campo: string): number {
  if (!campo) return 0;
  const palabras = campo.split(" ");
  let best = 0;
  for (const alt of term.alternativas) {
    if (palabras.includes(alt)) { best = Math.max(best, 1); continue; }
    for (const p of palabras) {
      if (p.includes(alt) || alt.includes(p)) { best = Math.max(best, 0.7); break; }
    }
    if (best < 0.5 && alt === raiz(term.original)) {
      for (const p of palabras) if (p.length >= 4 && edit1(p, alt)) { best = Math.max(best, 0.5); break; }
    }
  }
  return best;
}

/** Busca y rankea. Requiere que TODOS los términos (AND) hagan match en algún campo. */
export function buscarInsumos(insumos: Insumo[], q: string): Insumo[] {
  const terms = parseQuery(q);
  if (terms.length === 0) return insumos;

  const con: { i: Insumo; score: number }[] = [];
  for (const i of insumos) {
    const campos = camposNorm(i);
    let total = 0;
    let cumple = true;
    for (const term of terms) {
      let mejor = 0;
      for (const c of CAMPOS) {
        const s = scoreTerminoCampo(term, campos[c]);
        if (s > 0) mejor = Math.max(mejor, s * PESOS[c]);
      }
      if (mejor === 0) { cumple = false; break; }
      total += mejor;
    }
    if (cumple) con.push({ i, score: total * pesoUrgencia(i.urgencia) });
  }

  con.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const fa = Date.parse(a.i.fecha_registro ?? "") || 0;
    const fb = Date.parse(b.i.fecha_registro ?? "") || 0;
    return fb - fa;
  });
  return con.map((c) => c.i);
}

/** Coincidencia simple (para buscadores en cliente): sin acentos, multipalabra AND. */
export function coincide(campos: (string | null | undefined)[], q: string): boolean {
  const texto = normalizar(campos.filter(Boolean).join(" "));
  const tokens = normalizar(q).split(" ").filter(Boolean);
  return tokens.every((t) => texto.includes(t));
}

/** Sugerencias cuando no hay resultados: categorías y zonas frecuentes. */
export function sugerencias(insumos: Insumo[]): { categorias: string[]; zonas: string[] } {
  const cat = new Map<string, number>();
  const zon = new Map<string, number>();
  for (const i of insumos) {
    if (i.categoria) cat.set(i.categoria, (cat.get(i.categoria) ?? 0) + 1);
    if (i.zona) zon.set(i.zona, (zon.get(i.zona) ?? 0) + 1);
  }
  const top = (m: Map<string, number>) =>
    [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k]) => k);
  return { categorias: top(cat), zonas: top(zon) };
}
