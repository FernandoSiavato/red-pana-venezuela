import Header from "@/components/Header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Datos abiertos · Red Pana Venezuela",
  description: "API pública de datos humanitarios: insumos, albergues y páginas.",
};

const BASE = "https://red-pana-venezuela.vercel.app";

const ENDPOINTS = [
  {
    titulo: "📦 Insumos",
    path: "/api/insumos",
    desc: "Solicitudes y disponibilidad.",
    filtros: "?activos=1 · ?tipo=SOLICITUD · ?urgencia=alta · ?zona=catia · ?q=agua",
  },
  {
    titulo: "🏥 Albergues",
    path: "/api/albergues",
    desc: "Refugios y centros de acopio.",
    filtros: "?estado=operativo · ?zona=caricuao",
  },
  {
    titulo: "🔗 Páginas",
    path: "/api/paginas",
    desc: "Enlaces útiles y de confianza.",
    filtros: "?categoria=donaciones · ?q=...",
  },
];

export default function DatosPage() {
  return (
    <main>
      <Header
        titulo="Datos abiertos"
        subtitulo="La información de la red, libre para que cualquiera la use"
      />
      <div className="mx-auto max-w-md px-4 pb-10 pt-5 space-y-5">
        <p className="text-sm text-tinta">
          Toda la data de Red Pana Venezuela es <b>pública y de solo lectura</b>.
          Puedes consultarla desde cualquier web, app o herramienta (CORS abierto).
          Úsala para mapas, bots, tableros o lo que ayude. 🤝
        </p>

        {/* Rate limit */}
        <div className="rounded-2xl bg-pana-amarillo/20 p-4 text-sm text-[#92400e]">
          <p className="font-semibold">⏱️ Límite sano de uso</p>
          <p className="mt-1">
            Hasta <b>60 consultas por minuto</b> por IP. Si te pasas, responde{" "}
            <code className="rounded bg-black/10 px-1">429</code> con{" "}
            <code className="rounded bg-black/10 px-1">Retry-After</code>; espera unos
            segundos. La respuesta trae cabeceras{" "}
            <code className="rounded bg-black/10 px-1">X-RateLimit-*</code> con lo que te
            queda.
          </p>
        </div>

        {/* Endpoints */}
        {ENDPOINTS.map((e) => (
          <div key={e.path} className="rounded-2xl bg-tarjeta p-4 shadow-sm">
            <h2 className="text-lg font-bold">{e.titulo}</h2>
            <p className="mt-0.5 text-sm text-tinta-suave">{e.desc}</p>
            <a
              href={`${BASE}${e.path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block break-all rounded-xl bg-gray-900 px-3 py-2 font-mono text-xs text-green-300"
            >
              GET {BASE}
              {e.path}
            </a>
            <p className="mt-2 text-xs text-tinta-suave">
              <b>Filtros:</b> {e.filtros}
            </p>
          </div>
        ))}

        {/* Ejemplo */}
        <div className="rounded-2xl bg-tarjeta p-4 shadow-sm">
          <h2 className="text-base font-bold">Ejemplo</h2>
          <pre className="mt-2 overflow-x-auto rounded-xl bg-gray-900 p-3 font-mono text-xs text-gray-100">
{`curl "${BASE}/api/insumos?activos=1&urgencia=alta"

# Respuesta
{ "count": 12, "insumos": [ { "id": 7, "tipo": "SOLICITUD", ... } ] }`}
          </pre>
        </div>

        <p className="text-center text-xs text-tinta-suave">
          Solo lectura · datos públicos
          <br />
          Global Shapers Caracas · Red Pana Venezuela
        </p>
      </div>
    </main>
  );
}
