# Red Pana Venezuela 🤝

App pública **mobile-first** de respuesta humanitaria de Global Shapers Caracas.
Desde el teléfono, en segundos: **insumos**, **albergues** y **páginas útiles**.

🌐 **En vivo:** https://red-pana-venezuela.vercel.app
📖 **Datos abiertos / API:** https://red-pana-venezuela.vercel.app/datos

## ¿De dónde viene la información?
Los datos provienen de **grupos de WhatsApp** donde miles de personas reportan
necesidades, recursos y lugares tras el terremoto en Venezuela. Un agente de IA los
estructura y se cargan **lo más rápido posible** para ir dando seguimiento y marcar
qué se necesita y qué ya está cubierto.

## API pública de lectura (CORS abierto · rate limit 60/min por IP)
| Endpoint | Devuelve |
|---|---|
| `GET /api/insumos` | Solicitudes y disponibilidad de insumos |
| `GET /api/albergues` | Refugios y centros de acopio |
| `GET /api/paginas` | Enlaces útiles y de confianza |

Respuesta: `{ "count": N, "<recurso>": [...] }`. Filtros opcionales:
- Insumos: `?activos=1` · `?tipo=SOLICITUD` · `?urgencia=alta` · `?zona=catia` · `?q=agua`
- Albergues: `?estado=operativo` · `?zona=caricuao`
- Páginas: `?categoria=donaciones` · `?q=...`

```bash
curl "https://red-pana-venezuela.vercel.app/api/insumos?activos=1&urgencia=alta"
```

## Stack
Next.js 16 (App Router, TS) · Tailwind v4 · PWA · Vercel · Supabase (Postgres + RLS).

## Correr en local
```bash
npm install
# crea .env.local con NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

## Estructura
- `app/` — Inicio, `/insumos` (vista Lista + Vistazo), `/albergues`, `/paginas`, `/datos` (docs API).
- `app/api/` — endpoints públicos de lectura + carga admin (protegida por clave).
- `lib/` — capa de datos (Supabase), tipos, rate limit, agentes de carga.
- `docs/AGENTE_CARGA_SUPABASE.md` — prompts de los agentes de IA que cargan datos.

## Lectura pública, escritura admin
La lectura es libre. Escribir (agregar insumos/albergues/páginas) requiere una clave
admin y no está documentado públicamente. RLS de Supabase permite solo `SELECT` a `anon`.

Hecho con cariño por **Global Shapers Caracas**. 🇻🇪

> Despliegue automático: cada push a `main` se publica solo en Vercel.
