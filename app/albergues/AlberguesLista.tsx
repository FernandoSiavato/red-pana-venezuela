"use client";

import { useMemo, useState } from "react";
import type { Albergue } from "@/lib/types";
import { cuposLibres, urlMaps } from "@/lib/types";
import { coincide } from "@/lib/buscar";
import { BotonesContacto, BotonComoLlegar, Badge } from "@/components/Acciones";

export default function AlberguesLista({
  albergues,
  initialQ,
}: {
  albergues: Albergue[];
  initialQ?: string;
}) {
  const [q, setQ] = useState(initialQ ?? "");
  const [soloOperativos, setSoloOperativos] = useState(false);

  const lista = useMemo(() => {
    const texto = q.trim();
    return albergues
      .filter((a) =>
        soloOperativos ? (a.estado ?? "").toLowerCase() === "operativo" : true
      )
      .filter((a) =>
        !texto
          ? true
          : coincide([a.nombre, a.zona, a.municipio, a.direccion, a.necesidades], texto)
      );
  }, [albergues, q, soloOperativos]);

  return (
    <div className="mx-auto max-w-md px-4 pt-4">
      <input
        type="search"
        placeholder="Buscar albergue, zona…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="w-full rounded-2xl border border-gray-200 bg-tarjeta px-4 py-3 text-base outline-none focus:border-pana-azul"
      />

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => setSoloOperativos((v) => !v)}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
            soloOperativos
              ? "bg-pana-verde text-white"
              : "bg-tarjeta text-tinta border border-gray-200"
          }`}
        >
          ✅ Solo operativos
        </button>
      </div>

      <p className="mt-3 text-sm text-tinta-suave">
        {lista.length} {lista.length === 1 ? "albergue" : "albergues"}
      </p>

      <ul className="mt-2 space-y-3">
        {lista.map((a) => (
          <AlbergueCard key={a.id} a={a} />
        ))}
      </ul>

      {lista.length === 0 && (
        <p className="mt-10 text-center text-tinta-suave">
          No hay albergues con ese filtro. 🙏
        </p>
      )}
    </div>
  );
}

function AlbergueCard({ a }: { a: Albergue }) {
  const operativo = (a.estado ?? "").toLowerCase() === "operativo";
  const libres = cuposLibres(a);
  const pct =
    a.capacidad && a.capacidad > 0
      ? Math.min(100, Math.round(((a.ocupacion ?? 0) / a.capacidad) * 100))
      : null;

  return (
    <li className="rounded-2xl bg-tarjeta p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          className={
            operativo
              ? "bg-pana-verde/10 text-pana-verde"
              : "bg-pana-amarillo/20 text-[#92400e]"
          }
        >
          {operativo ? "🟢 Operativo" : "🛠️ En montaje"}
        </Badge>
        {a.tipo ? (
          <Badge className="bg-gray-100 text-tinta-suave">{a.tipo}</Badge>
        ) : null}
      </div>

      <h3 className="mt-2 text-lg font-bold leading-snug">{a.nombre}</h3>
      {(a.zona || a.municipio) && (
        <p className="mt-1 text-sm text-tinta-suave">
          📍 {[a.zona, a.municipio, a.estado_geo].filter(Boolean).join(", ")}
        </p>
      )}
      {a.direccion ? (
        <p className="mt-0.5 text-sm text-tinta-suave">{a.direccion}</p>
      ) : null}

      {/* Ocupación */}
      {pct !== null ? (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs font-medium text-tinta-suave">
            <span>
              {a.ocupacion ?? 0} / {a.capacidad} personas
            </span>
            <span className={libres ? "text-pana-verde" : "text-pana-rojo"}>
              {libres ? `${libres} cupos libres` : "Lleno"}
            </span>
          </div>
          <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full ${
                pct >= 100 ? "bg-pana-rojo" : "bg-pana-verde"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-tinta-suave">Cupo no reportado</p>
      )}

      {a.necesidades ? (
        <p className="mt-3 text-sm text-tinta">
          <span className="font-semibold">Necesita:</span> {a.necesidades}
        </p>
      ) : null}
      {a.servicios ? (
        <p className="mt-1 text-sm text-tinta-suave">
          <span className="font-semibold">Servicios:</span> {a.servicios}
        </p>
      ) : null}

      <BotonComoLlegar url={urlMaps(a)} />
      <BotonesContacto
        contacto={a.contacto}
        mensaje={`¡Hola! Pregunto por el albergue "${a.nombre}" (Red Pana Venezuela 🤝)`}
      />
    </li>
  );
}
