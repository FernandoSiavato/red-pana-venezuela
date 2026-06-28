# Bots de Telegram (Insumos / Albergues / Páginas) con n8n

3 bots, uno por grupo. **La app hace la IA, la subida de fotos y la base de datos.**
n8n solo: recibe de Telegram, valida la lista blanca, sube la foto, pide confirmación con
botones y llama a la app. Cada mensaje se responde como **reply** al mensaje original.

## Lo que necesitas tener
- `BASE = https://red-pana-venezuela.vercel.app`
- `CLAVE = ` la clave admin (`x-pana-admin`) — guárdala en n8n como credencial/variable.
- 3 tokens de **BotFather** (un bot por grupo).
- Lista de **user IDs de Telegram** autorizados a CARGAR (la valida n8n).
- En cada bot de BotFather: `/setprivacy` → **Disable** (para que el bot vea los mensajes del grupo).

## Mapeo bot → segmento
| Bot / grupo | `destino` | Endpoint de consulta |
|---|---|---|
| Insumos | `insumo` | `GET {BASE}/api/insumos` |
| Albergues | `albergue` | `GET {BASE}/api/albergues` |
| Páginas | `pagina` | `GET {BASE}/api/paginas` |

## Endpoints de la app (todos con header `x-pana-admin: {CLAVE}`)
| Acción | Llamada |
|---|---|
| Subir foto | `POST {BASE}/api/upload` body `{ "url": "<file_url de Telegram>" }` → `{ "foto_url" }` |
| Procesar con IA | `POST {BASE}/api/agente/procesar` body `{ "destino", "texto" }` → `{ ...campos, accion, alertas }` |
| Guardar | `POST {BASE}/api/ingest` body `{ "destino", ...campos, "foto_url" }` → `{ ok, registro:{ id, ... } }` |
| Actualizar estado | `POST {BASE}/api/update` body `{ "destino", "id", "estado" }` → `{ ok, registro }` |
| Consultar | `GET {BASE}/api/<segmento>?q=<texto>&activos=1` (público, sin clave) → `{ count, <recurso>[] }` |

## Flujo por bot (nodos n8n)
1. **Telegram Trigger** (Updates: message + callback_query).
2. **Switch por tipo de update:**
   - **callback_query** → ir a (6) Confirmar/Descartar.
   - **mensaje que responde a "Guardado #ID"** (`message.reply_to_message` contiene `#`) → ir a (7) Estado.
   - **texto empieza con `/buscar`** → ir a (5) Consultar.
   - **resto** → ir a (3) Cargar.
3. **Cargar — validar autorización:** ¿`message.from.id` está en la lista blanca?
   - No → responder "Solo personas autorizadas pueden cargar. Para consultar usa `/buscar <algo>`." y terminar.
   - Sí → seguir.
4. **Preparar registro:**
   a. ¿Hay foto? (`message.photo`): toma el `file_id` más grande →
      **Telegram `getFile`** → arma `file_url = https://api.telegram.org/file/bot{TOKEN}/{file_path}` →
      **HTTP POST** `{BASE}/api/upload` `{ url: file_url }` → guarda `foto_url`.
      (El texto viene en `message.caption` si hay foto, o en `message.text`.)
   b. **HTTP POST** `{BASE}/api/agente/procesar` `{ destino, texto }` → `campos`.
      - Si `campos.accion === "ignorar"` → responder "No entendí. Para consultar usa `/buscar`." y terminar.
   c. Guarda en **workflow static data** el objeto `{ ...campos, foto_url }` con clave
      `chat:{chat_id}:{message_id}` (para recuperarlo al confirmar).
   d. **Telegram sendMessage** con el resumen (ver formato abajo) y **inline_keyboard**:
      `[{text:"✅ Publicar", callback_data:"ok:{message_id}"}, {text:"❌ Descartar", callback_data:"no:{message_id}"}]`.
5. **Consultar:** quita `/buscar ` del texto → **HTTP GET** `{BASE}/api/<segmento>?q=<texto>&activos=1`
   → arma respuesta con los primeros 5 resultados (título, zona, contacto, estado) + enlace
   `{BASE}/<segmento>`. Si algún resultado tiene `foto_url`, puedes mandarlo con **sendPhoto**.
   Responder como reply.
6. **Confirmar (callback_query):** lee `callback_data`.
   - `ok:{id}` → recupera el registro de static data → **HTTP POST** `{BASE}/api/ingest` con
     `{ ...registro }` → editar el mensaje a "✅ Guardado #{registro.id}". (Ese "#ID" sirve para estados.)
   - `no:{id}` → editar el mensaje a "❌ Descartado". Borrar de static data.
   - Siempre responder `answerCallbackQuery`.
7. **Estado (responder a "Guardado #ID"):** extrae el número después de `#` del
   `reply_to_message.text`; mapea el comando/texto a estado
   (`/entregado`,`/listo`,`/completado`→Completado; `/cancelado`→Cancelado; `/proceso`→En proceso) →
   **HTTP POST** `{BASE}/api/update` `{ destino, id, estado }` → responder "Estado → {estado} ✅".

## Formato del resumen (paso 4d) — ejemplo Insumos
```
🟠 SOLICITUD · Cajas (20)
📍 LAS MERCEDES
📞 +58 414 1234567
📝 URGENTE, se pueden pedir en EPA
¿Publicar?
```

## Prompts
La IA vive en la app (`/api/agente/procesar`), así que **no necesitas configurar prompts en
n8n**. Los prompts por segmento están en `lib/agente.ts` / `lib/insumoPrompt.ts` y se usan solos.

## Notas
- La lista blanca y los tokens viven solo en n8n. La app valida con la clave admin.
- `getUpdates`/webhook: en n8n self-hosted usa el **Telegram Trigger** (webhook). Asegúrate de
  que tu n8n sea accesible por HTTPS (Telegram lo exige).
- Estado por defecto al guardar: Insumos "Pendiente", Albergues lo que diga el mensaje.
- 1 foto por registro (la primera). Páginas no llevan foto.
