// Capa de datos de Red Pana Venezuela.
// Lee desde Supabase (lectura pública vía anon key + RLS).
// Las funciones son async; las páginas las consumen igual que antes.
import { supabase } from "./supabase";
import type { Insumo, Albergue, Pagina } from "./types";

export async function getInsumos(): Promise<Insumo[]> {
  const { data, error } = await supabase
    .from("insumos")
    .select("*")
    .order("id", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Insumo[];
}

export async function getAlbergues(): Promise<Albergue[]> {
  const { data, error } = await supabase
    .from("albergues")
    .select("*")
    .order("id", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Albergue[];
}

export async function getPaginas(): Promise<Pagina[]> {
  const { data, error } = await supabase
    .from("paginas")
    .select("*")
    .eq("activa", true)
    .order("id", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Pagina[];
}
