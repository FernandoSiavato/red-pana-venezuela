import Header from "@/components/Header";
import AlberguesLista from "./AlberguesLista";
import { getAlbergues } from "@/lib/data";

export const revalidate = 30;

export default async function AlberguesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [albergues, sp] = await Promise.all([getAlbergues(), searchParams]);
  return (
    <main>
      <Header titulo="Albergues" subtitulo="Dónde hay refugio y cómo llegar" />
      <AlberguesLista albergues={albergues} initialQ={sp.q} />
    </main>
  );
}
