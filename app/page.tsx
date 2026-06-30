import Link from "next/link";
import { getInsumos, getAlbergues, getPaginas } from "@/lib/data";
import { esTerminal } from "@/lib/types";
import { resumenReportes } from "@/lib/reportes";
import ResumenReportes from "@/components/ResumenReportes";
import BuscadorGlobal, { type ItemIndice } from "./BuscadorGlobal";

export const revalidate = 30;

export default async function Inicio() {
  const [insumos, albergues, paginas] = await Promise.all([
    getInsumos(),
    getAlbergues(),
    getPaginas(),
  ]);

  const insumosActivos = insumos.filter((i) => !esTerminal(i.estado)).length;
  const resumen = resumenReportes(insumos);
  const alberguesOperativos = albergues.filter(
    (a) => (a.estado ?? "").toLowerCase() === "operativo"
  ).length;

  // Índice para el buscador global (datos ligeros, sirve offline)
  const indice: ItemIndice[] = [
    ...insumos
      .filter((i) => !esTerminal(i.estado))
      .map((i) => ({
        tipo: "insumo" as const,
        titulo: i.insumo,
        sub: [i.zona, i.cantidad].filter(Boolean).join(" · ") || "Insumo",
        href: "/insumos",
      })),
    ...albergues.map((a) => ({
      tipo: "albergue" as const,
      titulo: a.nombre,
      sub: [a.zona, a.municipio].filter(Boolean).join(" · ") || "Albergue",
      href: "/albergues",
    })),
    ...paginas.map((p) => ({
      tipo: "pagina" as const,
      titulo: p.titulo,
      sub: p.categoria || "Página",
      href: "/paginas",
    })),
  ];

  const modulos = [
    {
      href: "/insumos",
      emoji: "📦",
      titulo: "Insumos",
      desc: "Lo que se necesita y lo que hay",
      contador: `${insumosActivos} activos`,
      color: "bg-pana-verde",
    },
    {
      href: "/albergues",
      emoji: "🏥",
      titulo: "Albergues",
      desc: "Refugio y cómo llegar",
      contador: `${albergues.length} · ${alberguesOperativos} operativos`,
      color: "bg-pana-azul",
    },
    {
      href: "/paginas",
      emoji: "🔗",
      titulo: "Páginas",
      desc: "Enlaces útiles y de confianza",
      contador: `${paginas.length} enlaces`,
      color: "bg-[#92400e]",
    },
  ];

  return (
    <main>
      {/* Hero PANA */}
      <header className="bg-pana-amarillo">
        <div
          className="mx-auto max-w-md px-4 pb-12"
          style={{ paddingTop: "calc(env(safe-area-inset-top) + 2.5rem)" }}
        >
          <div className="flex items-center gap-2">
            <span className="text-3xl" aria-hidden>
              🤝
            </span>
            <span className="text-lg font-extrabold tracking-tight text-tinta">
              Red Pana Venezuela
            </span>
          </div>
          <p className="mt-5 text-3xl font-extrabold leading-tight text-tinta">
            La red que conecta la ayuda.
          </p>
          <p className="mt-2 text-base leading-relaxed text-tinta/80">
            Encuentra insumos, albergues y páginas útiles. Aquí estamos pa&apos;
            echarte una mano, pana. 🇻🇪
          </p>
        </div>
      </header>

      {/* Buscador flotante: se monta sobre el amarillo para separar limpio */}
      <div className="relative z-10 -mt-7">
        <BuscadorGlobal indice={indice}>
          {/* Tarjetas de módulos (cuando no hay búsqueda) */}
          <div className="mt-4 space-y-3 pb-4">
            {modulos.map((m) => (
              <Link
                key={m.href}
                href={m.href}
                className="flex items-center gap-4 rounded-2xl bg-tarjeta p-4 shadow-sm active:scale-[0.99]"
              >
                <span
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl ${m.color}/10`}
                  aria-hidden
                >
                  {m.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-lg font-bold">{m.titulo}</span>
                  <span className="block text-sm text-tinta-suave">
                    {m.desc}
                  </span>
                  <span className="mt-0.5 block text-sm font-semibold text-pana-azul">
                    {m.contador}
                  </span>
                </span>
                <span className="text-2xl text-tinta-suave" aria-hidden>
                  ›
                </span>
              </Link>
            ))}

            {/* Tablero de reportes (en vivo, clickeable) */}
            <ResumenReportes resumen={resumen} />
          </div>
        </BuscadorGlobal>
      </div>
    </main>
  );
}
