-- Esquema de Red Pana Venezuela para Supabase (Postgres).
-- Lectura pública (anon) vía RLS; escritura solo service role / admin.
-- Ejecutar una vez en el proyecto Supabase (SQL Editor o `apply_migration`).

create table if not exists insumos (
  id bigint primary key,
  tipo text,
  insumo text not null,
  categoria text,
  cantidad text,
  urgencia text,
  solicitante text,
  responsable text,
  zona text,
  contacto text,
  estado text,
  notas text,
  mensaje_original text,
  fecha_registro timestamptz,
  updated_at timestamptz default now()
);

create table if not exists albergues (
  id bigint primary key,
  nombre text not null,
  zona text,
  municipio text,
  estado_geo text,
  direccion text,
  plus_code text,
  tipo text,
  responsable text,
  contacto text,
  capacidad int,
  ocupacion int,
  servicios text,
  necesidades text,
  estado text,
  notas text,
  updated_at timestamptz default now()
);

create table if not exists paginas (
  id bigint primary key,
  url text not null,
  titulo text not null,
  descripcion text,
  categoria text,
  tipo text,
  verificacion text,
  activa boolean default true,
  veces_compartida int default 0
);

-- ===== RLS: info pública, solo lectura para anon =====
alter table insumos  enable row level security;
alter table albergues enable row level security;
alter table paginas  enable row level security;

create policy "lectura publica insumos"  on insumos  for select using (true);
create policy "lectura publica albergues" on albergues for select using (true);
create policy "lectura publica paginas"   on paginas  for select using (true);
-- INSERT/UPDATE/DELETE: sin policy para anon => denegado. Solo service role escribe.
