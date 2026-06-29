// Geocodificación aproximada por zona (portado de Sistema-Insumos-GSCCS/mapa.py).
// Solo se mapean las zonas conocidas; lo que no haga match se descarta del mapa.
import type { Insumo, Albergue } from "./types";
import { fechaLegible } from "./types";

// Pares [substring de la zona, [lat, lng]] — del más específico al más general.
export const COORDS: [string, [number, number]][] = [
  ["caraballeda", [10.611, -66.852]], ["catia la mar", [10.598, -67.030]], ["guaracarumbo", [10.598, -67.030]],
  ["maiquet", [10.601, -66.981]], ["playa grande", [10.609, -66.950]], ["anna mar", [10.609, -66.950]],
  ["residencias caribe", [10.602, -66.931]], ["de la guaira", [10.560, -66.930]], ["la guaira", [10.601, -66.931]],
  ["guatire", [10.476, -66.540]], ["oropeza", [10.475, -66.610]], ["guarenas", [10.475, -66.610]],
  ["domingo luciani", [10.470, -66.815]], ["llanito", [10.470, -66.815]],
  ["materno infantil", [10.433, -66.973]], ["caricuao", [10.433, -66.973]],
  ["miguel p", [10.460, -66.945]], ["perez carre", [10.460, -66.945]], ["pérez carre", [10.460, -66.945]],
  ["carlos arvelo", [10.486, -66.930]],
  ["perif", [10.503, -66.940]], ["catia", [10.503, -66.940]],
  ["antimano", [10.467, -66.985]], ["antímano", [10.467, -66.985]],
  ["petunia", [10.498, -66.844]], ["francisco de miranda", [10.498, -66.844]],
  ["los palos grandes", [10.500, -66.843]], ["parque del este", [10.497, -66.836]],
  ["plaza altamira", [10.495, -66.845]], ["altamira", [10.495, -66.845]], ["terekay", [10.495, -66.845]],
  ["la floresta", [10.499, -66.840]], ["chacait", [10.497, -66.853]], ["chaca", [10.497, -66.853]],
  ["bello monte", [10.485, -66.870]], ["las mercedes", [10.488, -66.860]], ["el recreo", [10.497, -66.873]],
  ["santa maría", [10.494, -66.860]], ["santa maria", [10.494, -66.860]],
  ["cotiza", [10.515, -66.905]], ["la pastora", [10.520, -66.915]], ["mecedores", [10.520, -66.915]],
  ["panteón", [10.508, -66.916]], ["panteon", [10.508, -66.916]],
  ["quinta crespo", [10.502, -66.914]], ["francisco pimentel", [10.502, -66.914]],
  ["ministerio de educa", [10.506, -66.914]], ["o'leary", [10.504, -66.917]], ["oleary", [10.504, -66.917]],
  ["rectorado", [10.490, -66.890]], ["ucv", [10.490, -66.890]], ["ucab", [10.464, -66.957]],
  ["la paz", [10.470, -66.940]], ["el para", [10.470, -66.940]],
  ["parque del oeste", [10.515, -66.918]], ["aristides", [10.515, -66.918]],
  ["la trinidad", [10.430, -66.860]], ["quinta esmeralda", [10.491, -66.851]],
  ["montalb", [10.4435, -66.9470]], ["la urbina", [10.493, -66.815]], ["el valle", [10.455, -66.910]],
  ["san martin", [10.493, -66.930]], ["san martín", [10.493, -66.930]], ["san bernardino", [10.506, -66.900]],
  ["pinto salina", [10.498, -66.880]], ["av. urdaneta", [10.506, -66.909]], ["urdaneta", [10.506, -66.909]],
  ["baralt", [10.508, -66.916]], ["av. méxico", [10.504, -66.906]], ["av. mexico", [10.504, -66.906]],
  ["valencia", [10.162, -68.007]], ["orinoco", [10.480, -66.903]],
  ["caracas", [10.4806, -66.9036]],
];

export const CATCOLOR: Record<string, string> = {
  medico: "#dc2626", equipo_medico: "#b91c1c", alimentos: "#16a34a", agua: "#0891b2",
  higiene: "#0d9488", refugio: "#7c3aed", ropa: "#db2777", equipo_proteccion: "#ea580c",
  herramientas: "#a16207", transporte: "#2563eb", voluntariado: "#0284c7", logistica: "#9333ea",
  coordinacion: "#475569", otros: "#6b7280",
};

export function geocodeZona(...textos: (string | null | undefined)[]): [number, number] | null {
  for (const t of textos) {
    const z = (t ?? "").toLowerCase();
    if (!z) continue;
    for (const [key, co] of COORDS) if (z.includes(key)) return co;
  }
  return null;
}

export function colorCategoria(cat: string | null | undefined): string {
  return CATCOLOR[(cat ?? "otros").toLowerCase()] ?? "#6b7280";
}

export interface PuntoMapa {
  id: number;
  lat: number;
  lng: number;
  titulo: string;
  zona: string;
  cat: string;
  color: string;
  urg: string;
  contacto: string;
  fecha: string;
  tipo: string;
}

// Separa marcadores que caen en el mismo punto (jitter en espiral).
function jitter(co: [number, number], seen: Record<string, number>): [number, number] {
  const k = `${co[0].toFixed(3)},${co[1].toFixed(3)}`;
  const n = seen[k] ?? 0;
  seen[k] = n + 1;
  const off = 0.0016 * n;
  return [co[0] + off * Math.cos(n), co[1] + off * Math.sin(n)];
}

export function geocodarInsumos(insumos: Insumo[]): PuntoMapa[] {
  const seen: Record<string, number> = {};
  const out: PuntoMapa[] = [];
  for (const i of insumos) {
    const co = geocodeZona(i.zona);
    if (!co) continue;
    const [lat, lng] = jitter(co, seen);
    out.push({
      id: i.id, lat, lng, titulo: i.insumo ?? "", zona: i.zona ?? "",
      cat: i.categoria ?? "otros", color: colorCategoria(i.categoria), urg: i.urgencia ?? "",
      contacto: i.contacto ?? "", fecha: fechaLegible(i.fecha_registro) ?? "", tipo: i.tipo ?? "SOLICITUD",
    });
  }
  return out;
}

export function geocodarAlbergues(albergues: Albergue[]): PuntoMapa[] {
  const seen: Record<string, number> = {};
  const out: PuntoMapa[] = [];
  for (const a of albergues) {
    const co = geocodeZona(a.zona, a.municipio, a.nombre);
    if (!co) continue;
    const [lat, lng] = jitter(co, seen);
    out.push({
      id: a.id, lat, lng, titulo: a.nombre ?? "", zona: a.zona ?? a.municipio ?? "",
      cat: a.tipo ?? "", color: "#4f46e5", urg: "", contacto: a.contacto ?? "", fecha: "", tipo: "ALBERGUE",
    });
  }
  return out;
}
