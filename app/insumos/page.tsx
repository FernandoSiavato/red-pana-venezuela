import Header from "@/components/Header";
import InsumosLista from "./InsumosLista";
import { getInsumos } from "@/lib/data";

export const revalidate = 30;

export default async function InsumosPage() {
  const insumos = await getInsumos();
  return (
    <main>
      <Header
        titulo="Insumos"
        subtitulo="Lo que se necesita y lo que hay disponible"
      />
      <InsumosLista insumos={insumos} />
    </main>
  );
}
