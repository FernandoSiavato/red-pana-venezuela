"use client";

import { useEffect } from "react";
import type { Insumo } from "@/lib/types";
import { tipoInsumoMeta, esTerminal, fechaLegible } from "@/lib/types";
import { BotonesContacto, Badge } from "@/components/Acciones";

const URG: Record<string, { label: string; clase: string }> = {
  alta: { label: "🔴 Alta", clase: "bg-pana-rojo/10 text-pana-rojo" },
  media: { label: "🟠 Media", clase: "bg-pana-amarillo/20 text-[#92400e]" },
  baja: { label: "🟢 Baja", clase: "bg-pana-verde/10 text-pana-verde" },
};

export default function InsumoDetalle({
  insumo,
  onClose,
}: {
  insumo: Insumo | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!insumo) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [insumo, onClose]);

  if (!insumo) return null;

  const i = insumo;
  const meta = tipoInsumoMeta(i.tipo);
  const urg = URG[(i.urgencia ?? "").toLowerCase()];
  const terminal = esTerminal(i.estado);
  const mapQ = i.zona ? encodeURIComponent(`${i.zona}, Venezuela`) : null;

  async function compartir() {
    const txt =
      `${meta.emoji} ${meta.label}: ${i.insumo}${i.cantidad ? ` (${i.cantidad})` : ""}` +
      `${i.zona ? `\n📍 ${i.zona}` : ""}` +
      `${i.contacto ? `\n📞 ${i.contacto}` : ""}` +
      `${i.notas ? `\n${i.notas}` : ""}` +
      `\n\nvía Red Pana Venezuela · red-pana-venezuela.vercel.app/insumos`;
    try {
      if (navigator.share) await navigator.share({ title: i.insumo, text: txt });
      else {
        await navigator.clipboard.writeText(txt);
        alert("Copiado al portapapeles ✅");
      }
    } catch {
      /* cancelado */
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-fondo shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra superior */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-gray-200 bg-tarjeta px-4 py-3">
          <span className="truncate text-sm font-bold">{meta.emoji} {meta.label}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={compartir}
              className="rounded-xl bg-pana-azul px-3 py-1.5 text-sm font-semibold text-white"
            >
              Compartir
            </button>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-300 text-tinta-suave"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Mapa */}
        {mapQ && (
          <iframe
            title="mapa"
            src={`https://www.google.com/maps?q=${mapQ}&output=embed`}
            className="h-44 w-full border-0"
            loading="lazy"
          />
        )}

        <div className="px-4 py-4">
          <h2 className="text-xl font-extrabold leading-tight">
            {i.insumo}
            {i.cantidad ? (
              <span className="font-bold text-tinta-suave"> · {i.cantidad}</span>
            ) : null}
          </h2>

          {/* Badges */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {urg && <Badge className={urg.clase}>{urg.label}</Badge>}
            {terminal ? (
              <Badge className="bg-gray-100 text-tinta-suave">✓ {i.estado}</Badge>
            ) : (
              i.estado && <Badge className="bg-pana-azul/10 text-pana-azul">{i.estado}</Badge>
            )}
          </div>

          {/* Contacto */}
          <BotonesContacto
            contacto={i.contacto}
            mensaje={`¡Hola! Te escribo por "${i.insumo}" (Red Pana Venezuela 🤝)`}
          />

          {/* Ficha de datos */}
          <dl className="mt-4 divide-y divide-gray-200 rounded-2xl bg-tarjeta px-4 shadow-sm">
            <Campo k="Categoría" v={i.categoria} />
            <Campo k="Tipo" v={`${meta.emoji} ${meta.label}`} />
            <Campo k="Urgencia" v={urg?.label ?? i.urgencia} />
            <Campo k="Estado" v={i.estado} />
            <Campo k="Cantidad" v={i.cantidad} />
            <Campo k="Zona" v={i.zona} />
            <Campo k="Solicitante" v={i.solicitante} />
            <Campo k="Responsable" v={i.responsable} />
            <Campo k="Contacto" v={i.contacto} />
            <Campo k="Fecha solicitud" v={fechaLegible(i.fecha_registro)} />
          </dl>

          {/* Notas */}
          {i.notas && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-tinta-suave">
                Notas
              </p>
              <p className="mt-1 rounded-2xl bg-tarjeta p-3 text-sm shadow-sm">{i.notas}</p>
            </div>
          )}

          {/* Mensaje original */}
          {i.mensaje_original && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-tinta-suave">
                Mensaje original
              </p>
              <p className="mt-1 whitespace-pre-wrap rounded-2xl bg-gray-100 p-3 text-sm text-tinta-suave">
                {i.mensaje_original}
              </p>
            </div>
          )}

          {mapQ && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${mapQ}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex h-11 items-center justify-center rounded-xl border border-gray-300 text-sm font-semibold text-pana-azul"
            >
              📍 Abrir en Google Maps
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function Campo({ k, v }: { k: string; v: string | null | undefined }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-2 py-2.5">
      <dt className="text-sm font-semibold text-tinta-suave">{k}</dt>
      <dd className="text-sm text-tinta">{v && String(v).trim() ? v : "—"}</dd>
    </div>
  );
}
