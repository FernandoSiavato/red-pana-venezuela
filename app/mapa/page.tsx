import MapaCliente from "@/components/MapaCliente";
import { getInsumos, getAlbergues } from "@/lib/data";
import { geocodarInsumos, geocodarAlbergues, CATCOLOR } from "@/lib/zonas";
import { esTerminal } from "@/lib/types";

export const revalidate = 30;

export default async function MapaPage() {
  const [insumos, albergues] = await Promise.all([getInsumos(), getAlbergues()]);
  const activos = insumos.filter(
    (i) =>
      (i.tipo === "SOLICITUD" || i.tipo === "INSUMO+SOLICITUD") &&
      !esTerminal(i.estado)
  );
  const puntos = geocodarInsumos(activos);
  const lugares = geocodarAlbergues(albergues);

  // Solo categorías presentes en el mapa, para la leyenda
  const catsPresentes = Array.from(new Set(puntos.map((p) => p.cat))).sort();

  return (
    <main className="relative">
      {/* Encabezado flotante */}
      <div className="pointer-events-none absolute left-1/2 top-3 z-[1000] -translate-x-1/2 rounded-xl bg-gray-900/85 px-4 py-2 text-center text-white shadow-lg">
        <p className="text-sm font-bold">🗺️ Mapa Red Pana</p>
        <p className="text-[11px] opacity-90">
          {puntos.length} solicitudes · {lugares.length} albergues · zonas mapeadas
        </p>
      </div>

      {/* Mapa (alto = pantalla menos el menú inferior) */}
      <div style={{ height: "calc(100dvh - 72px - env(safe-area-inset-bottom))" }}>
        <MapaCliente puntos={puntos} albergues={lugares} />
      </div>

      {/* Leyenda */}
      <div className="absolute bottom-3 right-3 z-[1000] max-h-[45vh] overflow-auto rounded-xl bg-white/95 p-3 text-xs shadow-lg">
        <p className="mb-1 font-bold">Lugares</p>
        <Fila color="#4f46e5" cuadro label="🏥 Albergue" />
        <div className="my-1.5 border-t border-gray-200" />
        <p className="mb-1 font-bold">Necesidades</p>
        {catsPresentes.map((c) => (
          <Fila key={c} color={CATCOLOR[c] ?? "#6b7280"} label={c.replace(/_/g, " ")} />
        ))}
      </div>
    </main>
  );
}

function Fila({
  color,
  label,
  cuadro,
}: {
  color: string;
  label: string;
  cuadro?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 capitalize leading-5">
      <span
        className="inline-block h-3.5 w-3.5"
        style={{ background: color, borderRadius: cuadro ? 4 : "50%" }}
      />
      {label}
    </div>
  );
}
