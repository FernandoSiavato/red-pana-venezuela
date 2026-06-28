import Header from "@/components/Header";
import AlberguesLista from "./AlberguesLista";
import { getAlbergues } from "@/lib/data";

export const revalidate = 30;

export default async function AlberguesPage() {
  const albergues = await getAlbergues();
  return (
    <main>
      <Header titulo="Albergues" subtitulo="Dónde hay refugio y cómo llegar" />
      <AlberguesLista albergues={albergues} />
    </main>
  );
}
