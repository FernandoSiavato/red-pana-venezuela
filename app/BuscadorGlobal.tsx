"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { coincide } from "@/lib/buscar";

export type ItemIndice = {
  tipo: "insumo" | "albergue" | "pagina";
  titulo: string;
  sub: string;
  href: string;
};

const ICONO = { insumo: "📦", albergue: "🏥", pagina: "🔗" } as const;
const NOMBRE = { insumo: "Insumo", albergue: "Albergue", pagina: "Página" } as const;

export default function BuscadorGlobal({
  indice,
  children,
}: {
  indice: ItemIndice[];
  children: React.ReactNode;
}) {
  const [q, setQ] = useState("");
  const texto = q.trim().toLowerCase();

  const resultados = useMemo(() => {
    if (!texto) return [];
    return indice
      .filter((it) => coincide([it.titulo, it.sub], texto))
      .slice(0, 30);
  }, [indice, texto]);

  return (
    <div className="mx-auto max-w-md px-4">
      <input
        type="search"
        inputMode="search"
        placeholder="Buscar en toda la red…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="w-full rounded-2xl border-2 border-transparent bg-tarjeta px-4 py-3.5 text-base shadow-sm outline-none focus:border-pana-azul"
      />

      {texto ? (
        <div className="mt-4">
          <p className="text-sm text-tinta-suave">
            {resultados.length}{" "}
            {resultados.length === 1 ? "resultado" : "resultados"}
          </p>
          <ul className="mt-2 space-y-2">
            {resultados.map((it, idx) => (
              <li key={idx}>
                <Link
                  href={it.href}
                  className="flex items-center gap-3 rounded-xl bg-tarjeta p-3 shadow-sm active:scale-[0.99]"
                >
                  <span className="text-2xl" aria-hidden>
                    {ICONO[it.tipo]}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">
                      {it.titulo}
                    </span>
                    <span className="block truncate text-sm text-tinta-suave">
                      {NOMBRE[it.tipo]} · {it.sub}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {resultados.length === 0 && (
            <p className="mt-10 text-center text-tinta-suave">
              Nada con esa palabra. Probá otra. 🙏
            </p>
          )}
        </div>
      ) : (
        children
      )}
    </div>
  );
}
