"use client";

import { useMemo, useState } from "react";
import type { Insumo } from "@/lib/types";
import { esTerminal, tipoInsumoMeta, fechaLegible } from "@/lib/types";
import { regionDe, grupoDe, labelRegion, labelGrupo, diaCaracas, labelDia } from "@/lib/reportes";
import { coincide } from "@/lib/buscar";
import { BotonesContacto, Badge } from "@/components/Acciones";
import InsumoDetalle from "@/components/InsumoDetalle";

type FiltroTipo = "todos" | "SOLICITUD" | "INSUMOS";
type Vista = "lista" | "vistazo";

const URG_COLOR: Record<string, string> = {
  alta: "#dc2626",
  media: "#d97706",
  baja: "#16a34a",
};

export default function InsumosLista({
  insumos,
  initialRegion,
  initialGrupo,
  initialDia,
  initialQ,
}: {
  insumos: Insumo[];
  initialRegion?: string;
  initialGrupo?: string;
  initialDia?: string;
  initialQ?: string;
}) {
  const [q, setQ] = useState(initialQ ?? "");
  const [tipo, setTipo] = useState<FiltroTipo>("todos");
  const [soloAlta, setSoloAlta] = useState(false);
  const [verResueltos, setVerResueltos] = useState(false);
  const [vista, setVista] = useState<Vista>("lista");
  const [sel, setSel] = useState<Insumo | null>(null);
  const [region, setRegion] = useState(initialRegion ?? "");
  const [grupo, setGrupo] = useState(initialGrupo ?? "");
  const [dia, setDia] = useState(initialDia ?? "");

  const resueltos = useMemo(
    () => insumos.filter((i) => esTerminal(i.estado)).length,
    [insumos]
  );

  const lista = useMemo(() => {
    const texto = q.trim().toLowerCase();
    return insumos
      .filter((i) => (verResueltos ? true : !esTerminal(i.estado)))
      .filter((i) =>
        tipo === "todos"
          ? true
          : tipo === "SOLICITUD"
          ? i.tipo === "SOLICITUD" || i.tipo === "INSUMO+SOLICITUD"
          : i.tipo === "INSUMOS" || i.tipo === "INSUMO+SOLICITUD"
      )
      .filter((i) => (soloAlta ? (i.urgencia ?? "").toLowerCase() === "alta" : true))
      .filter((i) => (region ? regionDe(i.zona) === region : true))
      .filter((i) => (grupo ? grupoDe(i.categoria) === grupo : true))
      .filter((i) => (dia ? diaCaracas(i.fecha_registro) === dia : true))
      .filter((i) => {
        if (!texto) return true;
        // Filtrar por número de ID: "94" o "#94"
        const num = texto.replace(/^#/, "");
        if (/^\d+$/.test(num) && String(i.id).startsWith(num)) return true;
        // Búsqueda de texto sin acentos y multipalabra
        return coincide(
          [i.insumo, i.zona, i.categoria, i.responsable, i.solicitante, i.notas, i.mensaje_original],
          texto
        );
      })
      .sort((a, b) => {
        const ua = (a.urgencia ?? "").toLowerCase() === "alta" ? 0 : 1;
        const ub = (b.urgencia ?? "").toLowerCase() === "alta" ? 0 : 1;
        if (ua !== ub) return ua - ub;
        return b.id - a.id; // dentro de cada grupo: lo más reciente primero
      });
  }, [insumos, q, tipo, soloAlta, verResueltos, region, grupo, dia]);

  return (
    <div className="mx-auto max-w-md px-4 pt-4">
      {/* Toggle de vista */}
      <div className="flex rounded-2xl bg-gray-200 p-1">
        <VistaBtn activo={vista === "lista"} onClick={() => setVista("lista")}>
          📋 Lista
        </VistaBtn>
        <VistaBtn activo={vista === "vistazo"} onClick={() => setVista("vistazo")}>
          👁️ Vistazo
        </VistaBtn>
      </div>

      {/* Buscador */}
      <input
        type="search"
        inputMode="search"
        placeholder="Buscar insumo, zona o #número…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="mt-3 w-full rounded-2xl border border-gray-200 bg-tarjeta px-4 py-3 text-base outline-none focus:border-pana-azul"
      />

      {/* Chips de filtro */}
      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
        <Chip activo={tipo === "todos"} onClick={() => setTipo("todos")}>
          Todos
        </Chip>
        <Chip activo={tipo === "SOLICITUD"} onClick={() => setTipo("SOLICITUD")}>
          ⭕️ Se necesita
        </Chip>
        <Chip activo={tipo === "INSUMOS"} onClick={() => setTipo("INSUMOS")}>
          ❇️ Disponible
        </Chip>
        <Chip activo={soloAlta} onClick={() => setSoloAlta((v) => !v)}>
          🔴 Urgente
        </Chip>
      </div>

      {(region || grupo || dia) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {dia && (
            <button
              onClick={() => setDia("")}
              className="inline-flex items-center gap-1 rounded-full bg-pana-verde/10 px-3 py-1.5 text-sm font-semibold text-pana-verde"
            >
              📅 {labelDia(dia)} <span className="text-base leading-none">✕</span>
            </button>
          )}
          {region && (
            <button
              onClick={() => setRegion("")}
              className="inline-flex items-center gap-1 rounded-full bg-pana-azul/10 px-3 py-1.5 text-sm font-semibold text-pana-azul"
            >
              📍 {labelRegion(region)} <span className="text-base leading-none">✕</span>
            </button>
          )}
          {grupo && (
            <button
              onClick={() => setGrupo("")}
              className="inline-flex items-center gap-1 rounded-full bg-pana-azul/10 px-3 py-1.5 text-sm font-semibold text-pana-azul"
            >
              🏷️ {labelGrupo(grupo)} <span className="text-base leading-none">✕</span>
            </button>
          )}
        </div>
      )}

      <p className="mt-3 text-sm text-tinta-suave">
        {lista.length} {lista.length === 1 ? "resultado" : "resultados"}
      </p>

      {vista === "lista" ? (
        <VistaListaCards lista={lista} onSelect={setSel} />
      ) : (
        <VistaVistazo lista={lista} onSelect={setSel} />
      )}

      <InsumoDetalle insumo={sel} onClose={() => setSel(null)} />

      {lista.length === 0 && (
        <div className="mt-10 text-center">
          <p className="text-tinta-suave">
            No encontramos nada con estos filtros. 🙏
          </p>
          {(q || soloAlta || region || grupo || dia || tipo !== "todos") && (
            <button
              onClick={() => {
                setQ("");
                setTipo("todos");
                setSoloAlta(false);
                setRegion("");
                setGrupo("");
                setDia("");
              }}
              className="mx-auto mt-3 flex min-h-[44px] items-center justify-center rounded-full bg-pana-azul px-5 text-sm font-semibold text-white"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {resueltos > 0 && (
        <button
          onClick={() => setVerResueltos((v) => !v)}
          className="mx-auto mt-6 block text-sm font-medium text-pana-azul"
        >
          {verResueltos ? "Ocultar resueltos" : `Ver resueltos (${resueltos})`}
        </button>
      )}
    </div>
  );
}

/* ---------- Vista LISTA (tarjetas con scroll, como antes) ---------- */
function VistaListaCards({
  lista,
  onSelect,
}: {
  lista: Insumo[];
  onSelect: (i: Insumo) => void;
}) {
  return (
    <ul className="mt-2 space-y-3">
      {lista.map((i) => (
        <InsumoCard key={i.id} i={i} onSelect={onSelect} />
      ))}
    </ul>
  );
}

function InsumoCard({ i, onSelect }: { i: Insumo; onSelect: (i: Insumo) => void }) {
  const meta = tipoInsumoMeta(i.tipo);
  const alta = (i.urgencia ?? "").toLowerCase() === "alta";
  const terminal = esTerminal(i.estado);
  const persona = i.responsable || i.solicitante;
  const fecha = fechaLegible(i.fecha_registro);
  return (
    <li
      onClick={() => onSelect(i)}
      className={`cursor-pointer rounded-2xl bg-tarjeta p-4 shadow-sm active:scale-[0.99] ${
        terminal ? "opacity-60" : ""
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={meta.clase}>
          {meta.emoji} {meta.label}
        </Badge>
        {alta && !terminal && (
          <Badge className="bg-pana-rojo/10 text-pana-rojo">🔴 Urgente</Badge>
        )}
        {terminal && (
          <Badge className="bg-gray-100 text-tinta-suave">✓ {i.estado}</Badge>
        )}
        <span className="ml-auto text-sm font-extrabold text-tinta-suave">#{i.id}</span>
      </div>
      <h3 className="mt-2 text-lg font-bold leading-snug">
        {i.insumo}
        {i.cantidad ? (
          <span className="font-semibold text-tinta-suave"> · {i.cantidad}</span>
        ) : null}
      </h3>
      {i.zona ? <p className="mt-1 text-sm text-tinta-suave">📍 {i.zona}</p> : null}
      {persona ? <p className="mt-0.5 text-sm text-tinta-suave">🧑 {persona}</p> : null}
      {fecha ? <p className="mt-0.5 text-xs text-tinta-suave">🕐 {fecha}</p> : null}
      {i.notas ? <p className="mt-2 text-sm text-tinta line-clamp-2">{i.notas}</p> : null}
      <div onClick={(e) => e.stopPropagation()}>
        <BotonesContacto
          contacto={i.contacto}
          mensaje={`¡Hola! Te escribo por "${i.insumo}" (Red Pana Venezuela 🤝)`}
        />
      </div>
      <p className="mt-2 text-center text-xs font-medium text-pana-azul">
        Toca para ver todo →
      </p>
    </li>
  );
}

/* ---------- Vista VISTAZO (todo agrupado de un golpe) ---------- */
function VistaVistazo({
  lista,
  onSelect,
}: {
  lista: Insumo[];
  onSelect: (i: Insumo) => void;
}) {
  const t = (i: Insumo) => (i.tipo || "").toUpperCase().replace(/\s/g, "");
  const sols = lista.filter((i) => t(i) === "SOLICITUD");
  const inss = lista.filter((i) => t(i) === "INSUMOS");
  const mixtos = lista.filter((i) =>
    ["INSUMO+SOLICITUD", "INSUMOS+SOLICITUD", "MIXTO"].includes(t(i))
  );
  const avisos = lista.filter((i) => t(i) === "AVISO");
  const urgentes = lista.filter((i) => (i.urgencia ?? "").toLowerCase() === "alta").length;

  return (
    <div className="mt-2">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-2">
        <Kpi n={sols.length} label="Piden" color="text-pana-rojo" />
        <Kpi n={inss.length} label="Hay" color="text-pana-verde" />
        <Kpi n={mixtos.length} label="Logíst." color="text-[#ca8a04]" />
        <Kpi n={urgentes} label="Urgent." color="text-pana-rojo" />
      </div>

      <Seccion titulo="⭕️ Se necesita" color="text-pana-rojo" items={sols} onSelect={onSelect} />
      <Seccion titulo="❇️ Disponible" color="text-pana-verde" items={inss} verde onSelect={onSelect} />
      <Seccion titulo="🟡 Ofrecen · falta logística" color="text-[#ca8a04]" items={mixtos} amarillo onSelect={onSelect} />
      <Seccion titulo="⚠️ Avisos" color="text-[#d97706]" items={avisos} amarillo onSelect={onSelect} />
    </div>
  );
}

function Kpi({ n, label, color }: { n: number; label: string; color: string }) {
  return (
    <div className="rounded-xl bg-tarjeta py-2 text-center shadow-sm">
      <div className={`text-xl font-extrabold ${color}`}>{n}</div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-tinta-suave">
        {label}
      </div>
    </div>
  );
}

function Seccion({
  titulo,
  color,
  items,
  verde,
  amarillo,
  onSelect,
}: {
  titulo: string;
  color: string;
  items: Insumo[];
  verde?: boolean;
  amarillo?: boolean;
  onSelect: (i: Insumo) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mt-5">
      <h3 className={`text-sm font-bold uppercase tracking-wide ${color}`}>
        {titulo} <span className="text-tinta-suave">· {items.length}</span>
      </h3>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {items.map((i) => (
          <MiniCard key={i.id} i={i} verde={verde} amarillo={amarillo} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

function MiniCard({
  i,
  verde,
  amarillo,
  onSelect,
}: {
  i: Insumo;
  verde?: boolean;
  amarillo?: boolean;
  onSelect: (i: Insumo) => void;
}) {
  const accent = verde
    ? "#16a34a"
    : amarillo
    ? "#eab308"
    : URG_COLOR[(i.urgencia ?? "").toLowerCase()] ?? "#dc2626";
  const sub = [i.cantidad, i.zona].filter(Boolean).join(" · ");
  const persona = i.solicitante || i.responsable;
  return (
    <div
      onClick={() => onSelect(i)}
      className="cursor-pointer rounded-lg bg-tarjeta p-2 shadow-sm active:scale-[0.98]"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <div className="flex items-start justify-between gap-1">
        <span className="text-xs font-bold leading-tight text-tinta line-clamp-2">
          {i.insumo}
        </span>
        <span className="shrink-0 text-[10px] font-extrabold text-tinta-suave">#{i.id}</span>
      </div>
      {sub ? (
        <p className="mt-0.5 text-[10px] leading-tight text-tinta-suave line-clamp-1">
          {sub}
        </p>
      ) : null}
      {persona ? (
        <p className="text-[10px] leading-tight text-tinta-suave line-clamp-1">
          {i.contacto ? "📞 " : "🧑 "}
          {i.contacto || persona}
        </p>
      ) : null}
      {i.notas ? (
        <p className="mt-1 text-[10px] leading-snug text-tinta line-clamp-2">{i.notas}</p>
      ) : null}
    </div>
  );
}

function VistaBtn({
  children,
  activo,
  onClick,
}: {
  children: React.ReactNode;
  activo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-colors ${
        activo ? "bg-tarjeta text-pana-azul shadow-sm" : "text-tinta-suave"
      }`}
    >
      {children}
    </button>
  );
}

function Chip({
  children,
  activo,
  onClick,
}: {
  children: React.ReactNode;
  activo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`min-h-[44px] whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
        activo ? "bg-pana-azul text-white" : "bg-tarjeta text-tinta border border-gray-200"
      }`}
    >
      {children}
    </button>
  );
}
