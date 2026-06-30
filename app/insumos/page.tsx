import Header from "@/components/Header";
import InsumosLista from "./InsumosLista";
import { getInsumos } from "@/lib/data";

export const revalidate = 30;

export default async function InsumosPage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string; grupo?: string }>;
}) {
  const [insumos, sp] = await Promise.all([getInsumos(), searchParams]);
  return (
    <main>
      <Header
        titulo="Insumos"
        subtitulo="Lo que se necesita y lo que hay disponible"
      />
      <InsumosLista
        insumos={insumos}
        initialRegion={sp.region}
        initialGrupo={sp.grupo}
      />
    </main>
  );
}
