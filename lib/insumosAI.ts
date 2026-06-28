// Lógica compartida del agente de insumos: extraer con IA + guardar en Supabase.
import "server-only";
import OpenAI from "openai";
import { supabaseAdmin } from "./supabase";
import { SYSTEM_PROMPT } from "./insumoPrompt";

const TIPOS = ["SOLICITUD", "INSUMOS", "AVISO", "INSUMO+SOLICITUD"];
const URGENCIAS = ["alta", "media", "baja"];
const ESTADOS = ["Pendiente", "Activo", "En proceso", "Listo", "Completado", "Cancelado", "Borrador"];

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    accion: { type: "string", enum: ["crear", "ignorar"] },
    insumo: { type: "string" },
    tipo: { type: "string", enum: TIPOS },
    categoria: { type: "string" },
    cantidad: { type: "string" },
    urgencia: { type: "string", enum: URGENCIAS },
    solicitante: { type: "string" },
    responsable: { type: "string" },
    zona: { type: "string" },
    contacto: { type: "string" },
    estado: { type: "string", enum: ESTADOS },
    notas: { type: "string" },
    alertas: { type: "array", items: { type: "string" } },
  },
  required: [
    "accion", "insumo", "tipo", "categoria", "cantidad", "urgencia",
    "solicitante", "responsable", "zona", "contacto", "estado", "notas", "alertas",
  ],
} as const;

export type InsumoIA = {
  accion?: string;
  insumo: string;
  tipo: string;
  categoria: string;
  cantidad: string;
  urgencia: string;
  solicitante: string;
  responsable: string;
  zona: string;
  contacto: string;
  estado: string;
  notas: string;
  alertas: string[];
};

/** Extrae un insumo estructurado desde texto crudo con OpenAI. */
export async function extraerInsumo(texto: string): Promise<InsumoIA> {
  const key = process.env.OPENAI_API_KEY;
  if (!key || key === "PENDIENTE") throw new Error("Falta OPENAI_API_KEY.");
  const client = new OpenAI({ apiKey: key });
  const completion = await client.chat.completions.create(
    {
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: texto },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "insumo", strict: true, schema: SCHEMA },
      },
    },
    { timeout: 45000 }
  );
  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("OpenAI no devolvió contenido.");
  return JSON.parse(raw) as InsumoIA;
}

/** Normaliza y guarda un insumo en Supabase (service role). Devuelve la fila creada. */
export async function guardarInsumo(
  campos: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const str = (k: string) => {
    const v = campos[k];
    return v === undefined || v === null || v === "" ? null : String(v).trim();
  };

  const insumo = str("insumo");
  if (!insumo) throw new Error("El campo 'insumo' es obligatorio.");

  let tipo = (str("tipo") ?? "SOLICITUD").toUpperCase();
  if (!TIPOS.includes(tipo)) tipo = "SOLICITUD";
  let urgencia = (str("urgencia") ?? "media").toLowerCase();
  if (!URGENCIAS.includes(urgencia)) urgencia = "media";
  let estado = str("estado") ?? "Pendiente";
  if (!ESTADOS.includes(estado)) estado = "Pendiente";

  const fila = {
    tipo,
    insumo,
    categoria: str("categoria"),
    cantidad: str("cantidad"),
    urgencia,
    solicitante: str("solicitante"),
    responsable: str("responsable"),
    zona: str("zona"),
    contacto: str("contacto"),
    estado,
    notas: str("notas"),
    mensaje_original: str("mensaje_original"),
    foto_url: str("foto_url"),
  };

  const { data, error } = await supabaseAdmin()
    .from("insumos")
    .insert(fila)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Record<string, unknown>;
}
