// Migración de los datos locales (data/*.json) a Supabase.
// Ejecutar UNA vez cuando exista el proyecto Supabase:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE=... node scripts/migrate.mjs
// Requiere: npm i @supabase/supabase-js
// La service role NUNCA va al cliente; solo se usa aquí, en local.
import { readFile } from "fs/promises";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE;
if (!url || !key) {
  console.error("Falta SUPABASE_URL y/o SUPABASE_SERVICE_ROLE");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

const cols = {
  insumos: ["id","tipo","insumo","categoria","cantidad","urgencia","solicitante","responsable","zona","contacto","estado","notas","mensaje_original","fecha_registro","updated_at"],
  albergues: ["id","nombre","zona","municipio","estado_geo","direccion","plus_code","tipo","responsable","contacto","capacidad","ocupacion","servicios","necesidades","estado","notas","updated_at"],
  paginas: ["id","url","titulo","descripcion","categoria","tipo","verificacion","activa","veces_compartida"],
};

for (const [tabla, campos] of Object.entries(cols)) {
  const raw = JSON.parse(await readFile(`./data/${tabla}.json`, "utf-8"));
  const filas = raw.map((r) => {
    const o = {};
    for (const c of campos) o[c] = r[c] ?? null;
    if (tabla === "paginas") o.activa = r.activa === 1 || r.activa === true;
    return o;
  });
  const { error } = await db.from(tabla).upsert(filas, { onConflict: "id" });
  if (error) { console.error(tabla, "ERROR", error.message); process.exit(1); }
  console.log(tabla, "→", filas.length, "filas subidas");
}
console.log("✓ Migración completa");
