import { jsonPublic, corsOptions } from "@/lib/apiPublic";

export const dynamic = "force-static";

// Especificación OpenAPI 3.1 de la API pública de Red Pana Venezuela.
// Solo lectura de datos (insumos, albergues, páginas). Importable en Swagger/Postman/Insomnia.
const SPEC = {
  openapi: "3.1.0",
  info: {
    title: "Red Pana Venezuela — API de datos abiertos",
    description:
      "Datos públicos de respuesta humanitaria (insumos, albergues, páginas). Lectura libre con CORS abierto y rate limit de 60 consultas/min por IP.",
    version: "1.0.0",
    contact: { name: "Global Shapers Caracas" },
  },
  servers: [{ url: "https://red-pana-venezuela.vercel.app", description: "Producción" }],
  paths: {
    "/api/insumos": {
      get: {
        tags: ["Datos"],
        summary: "Lista de insumos (solicitudes y disponibilidad)",
        parameters: [
          { name: "activos", in: "query", schema: { type: "string", enum: ["1"] }, description: "1 = oculta resueltos/cancelados" },
          { name: "tipo", in: "query", schema: { type: "string", enum: ["SOLICITUD", "INSUMOS", "AVISO", "INSUMO+SOLICITUD"] } },
          { name: "urgencia", in: "query", schema: { type: "string", enum: ["alta", "media", "baja"] } },
          { name: "estado", in: "query", schema: { type: "string" } },
          { name: "zona", in: "query", schema: { type: "string" }, description: "coincidencia parcial" },
          { name: "q", in: "query", schema: { type: "string" }, description: "búsqueda de texto" },
        ],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    count: { type: "integer" },
                    insumos: { type: "array", items: { $ref: "#/components/schemas/Insumo" } },
                  },
                },
              },
            },
          },
          "429": { description: "Demasiadas consultas (rate limit)" },
        },
      },
    },
    "/api/albergues": {
      get: {
        tags: ["Datos"],
        summary: "Lista de albergues",
        parameters: [
          { name: "estado", in: "query", schema: { type: "string" }, description: "ej. operativo" },
          { name: "zona", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    count: { type: "integer" },
                    albergues: { type: "array", items: { $ref: "#/components/schemas/Albergue" } },
                  },
                },
              },
            },
          },
          "429": { description: "Demasiadas consultas (rate limit)" },
        },
      },
    },
    "/api/paginas": {
      get: {
        tags: ["Datos"],
        summary: "Lista de páginas útiles",
        parameters: [
          { name: "categoria", in: "query", schema: { type: "string" } },
          { name: "q", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    count: { type: "integer" },
                    paginas: { type: "array", items: { $ref: "#/components/schemas/Pagina" } },
                  },
                },
              },
            },
          },
          "429": { description: "Demasiadas consultas (rate limit)" },
        },
      },
    },
  },
  components: {
    schemas: {
      Insumo: {
        type: "object",
        properties: {
          id: { type: "integer" },
          tipo: { type: "string" },
          insumo: { type: "string" },
          categoria: { type: "string", nullable: true },
          cantidad: { type: "string", nullable: true },
          urgencia: { type: "string", nullable: true },
          solicitante: { type: "string", nullable: true },
          responsable: { type: "string", nullable: true },
          zona: { type: "string", nullable: true },
          contacto: { type: "string", nullable: true },
          estado: { type: "string", nullable: true },
          notas: { type: "string", nullable: true },
          fecha_registro: { type: "string", nullable: true },
        },
      },
      Albergue: {
        type: "object",
        properties: {
          id: { type: "integer" },
          nombre: { type: "string" },
          zona: { type: "string", nullable: true },
          municipio: { type: "string", nullable: true },
          direccion: { type: "string", nullable: true },
          tipo: { type: "string", nullable: true },
          capacidad: { type: "integer", nullable: true },
          ocupacion: { type: "integer", nullable: true },
          necesidades: { type: "string", nullable: true },
          estado: { type: "string", nullable: true },
        },
      },
      Pagina: {
        type: "object",
        properties: {
          id: { type: "integer" },
          url: { type: "string" },
          titulo: { type: "string" },
          descripcion: { type: "string", nullable: true },
          categoria: { type: "string", nullable: true },
          verificacion: { type: "string", nullable: true },
        },
      },
    },
  },
};

export async function GET() {
  return jsonPublic(SPEC);
}

export async function OPTIONS() {
  return corsOptions();
}
