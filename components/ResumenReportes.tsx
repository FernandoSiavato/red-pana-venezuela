import Link from "next/link";
import type { ResumenReportes as Resumen } from "@/lib/reportes";

/** Tablero pulido de reportes de necesidad. Cada zona/categoría lleva a la lista filtrada. */
export default function ResumenReportes({ resumen }: { resumen: Resumen }) {
  const { total, hoy, zonas, categorias, porDia } = resumen;
  if (total === 0) return null;

  const maxDia = Math.max(1, ...porDia.map((d) => d.count));

  const maxZona = Math.max(1, ...zonas.map((z) => z.count));
  const topZona = zonas.reduce((a, b) => (b.count > a.count ? b : a), zonas[0]);

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
          <div className="text-4xl font-extrabold leading-none text-tinta">{total}</div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-tinta-suave">
            Activos
          </div>
        </div>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-tinta-suave">
        Solicitudes activas recibidas por la red, en vivo desde la base de datos.
      </p>
      {hoy > 0 && (
        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-pana-verde/10 px-3 py-1.5 text-sm font-bold text-pana-verde">
          <span className="h-2 w-2 rounded-full bg-pana-verde" />
          {hoy} {hoy === 1 ? "solicitud" : "solicitudes"} hoy
        </div>
      )}

      {/* Por zona */}
      <h3 className="mt-5 text-[11px] font-bold uppercase tracking-wider text-tinta-suave">
        Reportes por zona{" "}
        <span className="font-medium normal-case tracking-normal">— densidad</span>
      </h3>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {zonas.map((z) => {
          const destacada = z.key === topZona.key && z.count > 0;
          const llenas = z.count > 0 ? Math.max(1, Math.round((z.count / maxZona) * 12)) : 0;
          return (
            <Link
              key={z.key}
              href={`/insumos?region=${z.key}`}
              className={`rounded-2xl border p-3 active:scale-[0.99] ${
                destacada
                  ? "border-pana-azul/30 bg-pana-azul/5"
                  : "border-gray-200 bg-tarjeta"
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

      {/* Por día */}
      {porDia.length > 0 && (
        <>
          <h3 className="mt-5 text-[11px] font-bold uppercase tracking-wider text-tinta-suave">
            Solicitudes por día
          </h3>
          <div className="mt-2 space-y-2">
            {porDia.map((d) => (
              <Link
                key={d.dia}
                href={`/insumos?dia=${d.dia}`}
                className="flex items-center gap-3 active:opacity-80"
              >
                <span
                  className={`w-12 shrink-0 text-sm font-bold ${
                    d.esHoy ? "text-pana-verde" : "text-tinta-suave"
                  }`}
                >
                  {d.label}
                </span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full ${
                      d.esHoy ? "bg-pana-verde" : "bg-pana-azul/70"
                    }`}
                    style={{ width: `${Math.max(6, Math.round((d.count / maxDia) * 100))}%` }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right text-sm font-extrabold text-tinta">
                  {d.count}
                </span>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Por categoría */}
      <h3 className="mt-5 text-[11px] font-bold uppercase tracking-wider text-tinta-suave">
        Categorías más solicitadas
      </h3>
      <div className="mt-2 space-y-3">
        {categorias.slice(0, 4).map((c, idx) => (
          <Link
            key={c.key}
            href={`/insumos?grupo=${c.key}`}
            className="block active:opacity-80"
          >
            <div className="flex items-center gap-3">
              <span className="w-6 shrink-0 text-sm font-extrabold text-pana-azul/60">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <span className="flex-1 text-sm font-bold text-tinta">{c.label}</span>
              <span className="shrink-0 text-sm font-bold text-tinta">
                {c.count}
                <span className="font-medium text-tinta-suave"> / {total}</span>
              </span>
            </div>
            <div className="ml-9 mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-pana-azul"
                style={{ width: `${Math.max(4, Math.round((c.count / total) * 100))}%` }}
              />
            </div>
          </Link>
        ))}
      </div>

      <p className="mt-4 text-center text-xs font-medium text-pana-azul">
        Toca una zona o categoría para ver los reportes →
      </p>
    </section>
  );
}

function Densidad({ llenas }: { llenas: number }) {
  return (
    <div className="grid grid-cols-4 gap-[3px]">
      {Array.from({ length: 12 }).map((_, i) => (
        <span
          key={i}
          className={`h-[7px] w-[7px] rounded-[2px] ${
            i < llenas ? "bg-pana-azul" : "bg-gray-200"
          }`}
        />
      ))}
    </div>
  );
}
