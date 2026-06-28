"use client";

import { useMemo, useState } from "react";
import type { Pagina } from "@/lib/types";
import { Badge } from "@/components/Acciones";

export default function PaginasLista({ paginas }: { paginas: Pagina[] }) {
  const [q, setQ] = useState("");

  const lista = useMemo(() => {
    const texto = q.trim().toLowerCase();
    if (!texto) return paginas;
    return paginas.filter((p) =>
      [p.titulo, p.descripcion, p.categoria, p.url]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(texto)
    );
  }, [paginas, q]);

  return (
    <div className="mx-auto max-w-md px-4 pt-4">
      <input
        type="search"
        placeholder="Buscar página, tema…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="w-full rounded-2xl border border-gray-200 bg-tarjeta px-4 py-3 text-base outline-none focus:border-pana-azul"
      />

      <div className="mt-3 flex items-start gap-2 rounded-xl bg-pana-amarillo/20 p-3 text-sm text-[#92400e]">
        <span aria-hidden>⚠️</span>
        <span>
          No todas las páginas están verificadas. Revisá antes de donar o
          compartir datos.
        </span>
      </div>

      <p className="mt-3 text-sm text-tinta-suave">
        {lista.length} {lista.length === 1 ? "página" : "páginas"}
      </p>

      <ul className="mt-2 space-y-3">
        {lista.map((p) => (
          <PaginaCard key={p.id} p={p} />
        ))}
      </ul>

      {lista.length === 0 && (
        <p className="mt-10 text-center text-tinta-suave">
          No encontramos páginas con esa palabra. 🙏
        </p>
      )}
    </div>
  );
}

function PaginaCard({ p }: { p: Pagina }) {
  const verificada = (p.verificacion ?? "").toLowerCase() === "verificada";
  let host = p.url;
  try {
    host = new URL(p.url).hostname.replace(/^www\./, "");
  } catch {}
  return (
    <li className="rounded-2xl bg-tarjeta p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        {verificada ? (
          <Badge className="bg-pana-verde/10 text-pana-verde">✅ Verificada</Badge>
        ) : (
          <Badge className="bg-gray-100 text-tinta-suave">Sin verificar</Badge>
        )}
        {p.categoria ? (
          <Badge className="bg-pana-azul/10 text-pana-azul">{p.categoria}</Badge>
        ) : null}
      </div>

      <h3 className="mt-2 text-lg font-bold leading-snug">{p.titulo}</h3>
      {p.descripcion ? (
        <p className="mt-1 text-sm text-tinta">{p.descripcion}</p>
      ) : null}

      <a
        href={p.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex h-11 items-center justify-center gap-1.5 rounded-xl bg-pana-azul text-sm font-semibold text-white active:scale-[0.98]"
      >
        🔗 Abrir {host}
      </a>
    </li>
  );
}
