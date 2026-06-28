"use client";

import { useState } from "react";
import Link from "next/link";

const TIPOS = ["SOLICITUD", "INSUMOS", "AVISO", "INSUMO+SOLICITUD"];
const URGENCIAS = ["alta", "media", "baja"];
const ESTADOS = ["Pendiente", "Activo", "En proceso", "Listo", "Completado", "Cancelado"];

type Campos = {
  tipo: string;
  insumo: string;
  categoria: string;
  cantidad: string;
  urgencia: string;
  zona: string;
  contacto: string;
  responsable: string;
  solicitante: string;
  estado: string;
  notas: string;
  mensaje_original: string;
};

const VACIO: Campos = {
  tipo: "SOLICITUD",
  insumo: "",
  categoria: "",
  cantidad: "",
  urgencia: "media",
  zona: "",
  contacto: "",
  responsable: "",
  solicitante: "",
  estado: "Pendiente",
  notas: "",
  mensaje_original: "",
};

export default function InsumosAI() {
  const [pass, setPass] = useState("");
  const [entrado, setEntrado] = useState(false);
  const [texto, setTexto] = useState("");
  const [campos, setCampos] = useState<Campos>(VACIO);
  const [alertas, setAlertas] = useState<string[]>([]);
  const [paso, setPaso] = useState<"input" | "preview" | "done">("input");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  function headers() {
    return { "content-type": "application/json", "x-pana-admin": pass };
  }

  async function procesar() {
    setError("");
    setCargando(true);
    try {
      const res = await fetch("/api/insumos-ai/extract", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ texto }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error procesando.");
        return;
      }
      setCampos({
        ...VACIO,
        ...Object.fromEntries(
          Object.keys(VACIO).map((k) => [k, data[k] != null ? String(data[k]) : VACIO[k as keyof Campos]])
        ),
        mensaje_original: data.mensaje_original || texto,
      } as Campos);
      setAlertas(Array.isArray(data.alertas) ? data.alertas.map(String) : []);
      setPaso("preview");
    } catch {
      setError("No se pudo conectar.");
    } finally {
      setCargando(false);
    }
  }

  async function publicar() {
    setError("");
    setCargando(true);
    try {
      const res = await fetch("/api/insumos-ai/publish", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(campos),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error publicando.");
        return;
      }
      setPaso("done");
    } catch {
      setError("No se pudo conectar.");
    } finally {
      setCargando(false);
    }
  }

  function otro() {
    setTexto("");
    setCampos(VACIO);
    setAlertas([]);
    setError("");
    setPaso("input");
  }

  const set = (k: keyof Campos) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setCampos((c) => ({ ...c, [k]: e.target.value }));

  // ---- Gate de contraseña ----
  if (!entrado) {
    return (
      <main className="mx-auto max-w-md px-4 pt-16">
        <div className="rounded-2xl bg-tarjeta p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden>🤝</span>
            <span className="text-sm font-bold">Red Pana · Panel</span>
          </div>
          <h1 className="mt-3 text-2xl font-extrabold">Insumos IA</h1>
          <p className="mt-1 text-sm text-tinta-suave">
            Pega un mensaje de WhatsApp, la IA lo ordena y tú lo publicas.
          </p>
          <input
            type="password"
            placeholder="Contraseña admin"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && pass && setEntrado(true)}
            className="mt-4 w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-pana-azul"
          />
          <button
            onClick={() => pass && setEntrado(true)}
            className="mt-3 h-12 w-full rounded-xl bg-pana-azul font-semibold text-white active:scale-[0.99]"
          >
            Entrar
          </button>
        </div>
      </main>
    );
  }

  // ---- Pantalla de éxito ----
  if (paso === "done") {
    return (
      <main className="mx-auto max-w-md px-4 pt-16 text-center">
        <div className="rounded-2xl bg-tarjeta p-8 shadow-sm">
          <div className="text-5xl">✅</div>
          <h1 className="mt-3 text-2xl font-extrabold">¡Publicado, pana!</h1>
          <p className="mt-1 text-tinta-suave">Ya aparece en la lista de insumos.</p>
          <Link
            href="/insumos"
            className="mt-5 flex h-12 items-center justify-center rounded-xl bg-pana-verde font-semibold text-white"
          >
            Ver en Insumos
          </Link>
          <button
            onClick={otro}
            className="mt-3 h-12 w-full rounded-xl border border-gray-200 font-semibold"
          >
            Procesar otro mensaje
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 pb-10 pt-8">
      <div className="flex items-center gap-2">
        <span className="text-2xl" aria-hidden>🤝</span>
        <span className="text-sm font-bold">Red Pana · Panel</span>
      </div>
      <h1 className="mt-2 text-2xl font-extrabold">Insumos IA</h1>

      {error && (
        <p className="mt-3 rounded-xl bg-pana-rojo/10 px-3 py-2 text-sm font-medium text-pana-rojo">
          {error}
        </p>
      )}

      {paso === "input" && (
        <>
          <p className="mt-2 text-sm text-tinta-suave">
            Pega aquí el mensaje de WhatsApp tal cual llegó.
          </p>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={8}
            placeholder="Ej: Necesitamos 20 cascos en San Bernardino, contacto 0414..."
            className="mt-3 w-full rounded-2xl border border-gray-200 bg-tarjeta p-4 text-base outline-none focus:border-pana-azul"
          />
          <button
            onClick={procesar}
            disabled={cargando || !texto.trim()}
            className="mt-3 h-12 w-full rounded-xl bg-pana-azul font-semibold text-white disabled:opacity-50 active:scale-[0.99]"
          >
            {cargando ? "Procesando…" : "🤖 Procesar con IA"}
          </button>
        </>
      )}

      {paso === "preview" && (
        <>
          <p className="mt-2 text-sm text-tinta-suave">
            Revisa y corrige lo que haga falta antes de publicar.
          </p>

          {alertas.length > 0 && (
            <div className="mt-3 rounded-xl bg-pana-amarillo/20 p-3 text-sm text-[#92400e]">
              <p className="font-semibold">⚠️ La IA marcó dudas:</p>
              <ul className="mt-1 list-disc pl-5">
                {alertas.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          )}

          <div className="mt-4 space-y-3">
            <Campo label="Insumo *">
              <input value={campos.insumo} onChange={set("insumo")} className={inputCls} />
            </Campo>
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Tipo">
                <select value={campos.tipo} onChange={set("tipo")} className={inputCls}>
                  {TIPOS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Campo>
              <Campo label="Urgencia">
                <select value={campos.urgencia} onChange={set("urgencia")} className={inputCls}>
                  {URGENCIAS.map((u) => <option key={u}>{u}</option>)}
                </select>
              </Campo>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Categoría">
                <input value={campos.categoria} onChange={set("categoria")} className={inputCls} />
              </Campo>
              <Campo label="Cantidad">
                <input value={campos.cantidad} onChange={set("cantidad")} className={inputCls} />
              </Campo>
            </div>
            <Campo label="Zona">
              <input value={campos.zona} onChange={set("zona")} className={inputCls} />
            </Campo>
            <Campo label="Contacto">
              <input value={campos.contacto} onChange={set("contacto")} className={inputCls} />
            </Campo>
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Responsable">
                <input value={campos.responsable} onChange={set("responsable")} className={inputCls} />
              </Campo>
              <Campo label="Solicitante">
                <input value={campos.solicitante} onChange={set("solicitante")} className={inputCls} />
              </Campo>
            </div>
            <Campo label="Estado">
              <select value={campos.estado} onChange={set("estado")} className={inputCls}>
                {ESTADOS.map((e) => <option key={e}>{e}</option>)}
              </select>
            </Campo>
            <Campo label="Notas">
              <textarea value={campos.notas} onChange={set("notas")} rows={3} className={inputCls} />
            </Campo>
          </div>

          <button
            onClick={publicar}
            disabled={cargando || !campos.insumo.trim()}
            className="mt-4 h-12 w-full rounded-xl bg-pana-verde font-semibold text-white disabled:opacity-50 active:scale-[0.99]"
          >
            {cargando ? "Publicando…" : "✅ Publicar"}
          </button>
          <button
            onClick={() => setPaso("input")}
            className="mt-2 h-11 w-full rounded-xl border border-gray-200 font-semibold"
          >
            ← Volver
          </button>
        </>
      )}
    </main>
  );
}

const inputCls =
  "w-full rounded-xl border border-gray-200 bg-tarjeta px-3 py-2.5 text-base outline-none focus:border-pana-azul";

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-tinta-suave">{label}</span>
      {children}
    </label>
  );
}
