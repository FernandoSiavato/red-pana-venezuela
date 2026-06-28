// Extracción con IA por destino (insumo / albergue / pagina) usando gpt-4.1-mini.
import "server-only";
import OpenAI from "openai";
import { SYSTEM_PROMPT as PROMPT_INSUMO } from "./insumoPrompt";

const MODEL = "gpt-4.1-mini";

export type Destino = "insumo" | "albergue" | "pagina";

const PROMPT_ALBERGUE = `Eres el AGENTE DE ALBERGUES de Red Pana Venezuela (respuesta humanitaria en Venezuela).
Lees UN mensaje sobre un LUGAR donde se refugia/atiende gente o se reciben donaciones
(refugio, punto en calle, centro de acopio, centro de salud) y extraes sus datos.
Si NO es sobre un albergue/lugar, marca accion="ignorar".
REGLAS: NUNCA inventes (campo ausente=""). Teléfono venezolano→+58 (0414...→"+58 414 ..."),
si es nombre déjalo. ZONA en MAYÚSCULAS. estado: ya funcionando/recibiendo→operativo;
montando→en_montaje; si no está claro→por_confirmar. capacidad/ocupacion como número o "".
Pon el texto crudo en mensaje_original. Todo en español.`;

const PROMPT_PAGINA = `Eres el AGENTE DE PÁGINAS de Red Pana Venezuela (respuesta humanitaria en Venezuela).
Lees UN mensaje que comparte una PÁGINA WEB útil (donaciones, búsqueda de personas,
información oficial, recursos) y extraes sus datos.
Si NO contiene una URL / no es una página útil, marca accion="ignorar".
REGLAS: NUNCA inventes (campo ausente=""). La url debe ser completa con http/https.
verificacion="verificada" solo si dice que es oficial; si no, "sin_verificar".
categoria: donaciones|desaparecidos|informacion|salud|refugios|otros. Todo en español.`;

const SCHEMA_ALBERGUE = {
  type: "object",
  additionalProperties: false,
  properties: {
    accion: { type: "string", enum: ["crear", "ignorar"] },
    nombre: { type: "string" },
    zona: { type: "string" },
    municipio: { type: "string" },
    estado_geo: { type: "string" },
    direccion: { type: "string" },
    plus_code: { type: "string" },
    tipo: { type: "string" },
    responsable: { type: "string" },
    contacto: { type: "string" },
    capacidad: { type: "string" },
    ocupacion: { type: "string" },
    servicios: { type: "string" },
    necesidades: { type: "string" },
    estado: { type: "string" },
    notas: { type: "string" },
    mensaje_original: { type: "string" },
    alertas: { type: "array", items: { type: "string" } },
  },
  required: [
    "accion", "nombre", "zona", "municipio", "estado_geo", "direccion", "plus_code",
    "tipo", "responsable", "contacto", "capacidad", "ocupacion", "servicios",
    "necesidades", "estado", "notas", "mensaje_original", "alertas",
  ],
} as const;

const SCHEMA_PAGINA = {
  type: "object",
  additionalProperties: false,
  properties: {
    accion: { type: "string", enum: ["crear", "ignorar"] },
    url: { type: "string" },
    titulo: { type: "string" },
    descripcion: { type: "string" },
    categoria: { type: "string" },
    tipo: { type: "string" },
    verificacion: { type: "string", enum: ["sin_verificar", "verificada"] },
    mensaje_original: { type: "string" },
    alertas: { type: "array", items: { type: "string" } },
  },
  required: [
    "accion", "url", "titulo", "descripcion", "categoria", "tipo",
    "verificacion", "mensaje_original", "alertas",
  ],
} as const;

// El insumo reusa el prompt/flujo de insumosAI, pero lo replicamos aquí con su schema
// para tener un único punto de extracción por destino.
const SCHEMA_INSUMO = {
  type: "object",
  additionalProperties: false,
  properties: {
    accion: { type: "string", enum: ["crear", "ignorar"] },
    insumo: { type: "string" },
    tipo: { type: "string", enum: ["SOLICITUD", "INSUMOS", "AVISO", "INSUMO+SOLICITUD"] },
    categoria: { type: "string" },
    cantidad: { type: "string" },
    urgencia: { type: "string", enum: ["alta", "media", "baja"] },
    solicitante: { type: "string" },
    responsable: { type: "string" },
    zona: { type: "string" },
    contacto: { type: "string" },
    estado: { type: "string", enum: ["Pendiente", "Activo", "En proceso", "Listo", "Completado", "Cancelado"] },
    notas: { type: "string" },
    mensaje_original: { type: "string" },
    alertas: { type: "array", items: { type: "string" } },
  },
  required: [
    "accion", "insumo", "tipo", "categoria", "cantidad", "urgencia", "solicitante",
    "responsable", "zona", "contacto", "estado", "notas", "mensaje_original", "alertas",
  ],
} as const;

const CONFIG: Record<Destino, { prompt: string; schema: unknown; name: string }> = {
  insumo: { prompt: PROMPT_INSUMO, schema: SCHEMA_INSUMO, name: "insumo" },
  albergue: { prompt: PROMPT_ALBERGUE, schema: SCHEMA_ALBERGUE, name: "albergue" },
  pagina: { prompt: PROMPT_PAGINA, schema: SCHEMA_PAGINA, name: "pagina" },
};

/** Extrae los campos de un mensaje según el destino. Devuelve el objeto parseado. */
export async function extraer(
  destino: Destino,
  texto: string
): Promise<Record<string, unknown>> {
  const key = process.env.OPENAI_API_KEY;
  if (!key || key === "PENDIENTE") throw new Error("Falta OPENAI_API_KEY.");
  const cfg = CONFIG[destino];
  if (!cfg) throw new Error("Destino inválido.");

  const client = new OpenAI({ apiKey: key });
  const completion = await client.chat.completions.create(
    {
      model: MODEL,
      messages: [
        { role: "system", content: cfg.prompt },
        { role: "user", content: texto },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: cfg.name,
          strict: true,
          schema: cfg.schema as Record<string, unknown>,
        },
      },
    },
    { timeout: 45000 }
  );
  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("OpenAI no devolvió contenido.");
  const obj = JSON.parse(raw) as Record<string, unknown>;
  obj.destino = destino;
  if (!obj.mensaje_original) obj.mensaje_original = texto;
  return obj;
}
