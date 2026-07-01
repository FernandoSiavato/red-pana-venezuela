"use client";

import { useState } from "react";
import Link from "next/link";
import type { ResumenVistas } from "@/lib/reportes";

type VistaKey = "hoy" | "ayer" | "general";

/** Tablero de reportes de necesidad con toggle Hoy / Ayer / General (filtra todo el tablero). */
export default function ResumenReportes({ vistas }: { vistas: ResumenVistas }) {
  const [v, setV] = useState<VistaKey>("general");

  if (vistas.general.total === 0) return null;

  const data = vistas[v];
  const diaParam = v === "hoy" ? vistas.hoyStr : v === "ayer" ? vistas.ayerStr : null;
  const suffix = diaParam ? `&dia=${diaParam}` : "";
  const sub =
    v === "hoy" ? "solicitudes de hoy" : v === "ayer" ? "solicitudes de ayer" : "solicitudes activas";

  const maxZona = Math.max(1, ...data.zonas.map((z) => z.count));
  const topZona = data.zonas.reduce((a, b) => (b.count > a.count ? b : a), data.zonas[0]);

  const botones: { key: VistaKey; label: string; count: number }[] = [
    { key: "hoy", label: "Hoy", count: vistas.hoy.total },
    { key: "ayer", label: "Ayer", count: vistas.ayer.total },
    { key: "general", label: "General", count: vistas.general.total },
  ];

  return (
    <section className="mt-2 rounded-3xl bg-tarjeta p-5 shadow-sm">
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-pana-azul">
            Se necesita
          </p>
          <h2 className="mt-1 text-2xl font-extrabold leading-tight text-tinta">
            Reportes de necesidad
          </h2>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-4xl font-extrabold leading-none text-tinta">{data.total}</div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-tinta-suave">
            {v === "general" ? "Activos" : v}
          </div>
        </div>
      </div>

      {/* Toggle Hoy / Ayer / General */}
      <div className="mt-4 flex rounded-2xl bg-gray-100 p-1">
        {botones.map((b) => (
          <button
            key={b.key}
            onClick={() => setV(b.key)}
            className={`flex-1 rounded-xl py-2 text-sm font-bold transition-colors ${
              v === b.key ? "bg-tarjeta text-pana-azul shadow-sm" : "text-tinta-suave"
            }`}
          >
            {b.label}
            <span className={`ml-1 text-xs font-semibold ${v === b.key ? "text-pana-azul/70" : "text-tinta-suave"}`}>
              {b.count}
            </span>
          </button>
        ))}
      </div>

      {data.total === 0 ? (
        <p className="mt-5 rounded-2xl bg-gray-50 py-6 text-center text-sm text-tinta-suave">
          No hay {sub} todavía. 🙌
        </p>
      ) : (
        <>
          <p className="mt-3 text-sm leading-relaxed text-tinta-suave">
            {data.total} {sub}, en vivo desde la base de datos.
          </p>

          {/* Por zona */}
          <h3 className="mt-5 text-[11px] font-bold uppercase tracking-wider text-tinta-suave">
            Reportes por zona{" "}
            <span className="font-medium normal-case tracking-normal">— densidad</span>
          </h3>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {data.zonas
              .filter((z) => z.count > 0)
              .map((z) => {
                const destacada = z.key === topZona.key && z.count > 0;
                const llenas = z.count > 0 ? Math.max(1, Math.round((z.count / maxZona) * 12)) : 0;
                return (
                  <Link
                    key={z.key}
                    href={`/insumos?region=${z.key}${suffix}`}
                    className={`rounded-2xl border p-3 active:scale-[0.99] ${
                      destacada ? "border-pana-azul/30 bg-pana-azul/5" : "border-gray-200 bg-tarjeta"
                    }`}
                  >
                    <p className="text-[13px] font-bold leading-tight text-tinta">{z.label}</p>
                    <div className="mt-1 flex items-end justify-between gap-2">
                      <p className="text-2xl font-extrabold leading-none text-tinta">
                        {z.count}
                        <span className="ml-1 text-[11px] font-semibold text-tinta-suave">
                          reportes
                        </span>
                      </p>
                      <Densidad llenas={llenas} />
                    </div>
                  </Link>
                );
              })}
          </div>

          {/* Por categoría */}
          <h3 className="mt-5 text-[11px] font-bold uppercase tracking-wider text-tinta-suave">
            Categorías más solicitadas
          </h3>
          <div className="mt-2 space-y-3">
            {data.categorias.slice(0, 4).map((c, idx) => (
              <Link
                key={c.key}
                href={`/insumos?grupo=${c.key}${suffix}`}
                className="block active:opacity-80"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 shrink-0 text-sm font-extrabold text-pana-azul/60">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1 text-sm font-bold text-tinta">{c.label}</span>
                  <span className="shrink-0 text-sm font-bold text-tinta">
                    {c.count}
                    <span className="font-medium text-tinta-suave"> / {data.total}</span>
                  </span>
                </div>
                <div className="ml-9 mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-pana-azul"
                    style={{ width: `${Math.max(4, Math.round((c.count / data.total) * 100))}%` }}
                  />
                </div>
              </Link>
            ))}
          </div>

          <p className="mt-4 text-center text-xs font-medium text-pana-azul">
            Toca una zona o categoría para ver los reportes →
          </p>
        </>
      )}
    </section>
  );
}

function Densidad({ llenas }: { llenas: number }) {
  return (
    <div className="grid grid-cols-4 gap-[3px]">
      {Array.from({ length: 12 }).map((_, i) => (
        <span
          key={i}
          className={`h-[7px] w-[7px] rounded-[2px] ${i < llenas ? "bg-pana-azul" : "bg-gray-200"}`}
        />
      ))}
    </div>
  );
}
