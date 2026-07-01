import Header from "@/components/Header";
import PaginasLista from "./PaginasLista";
import { getPaginas } from "@/lib/data";

export const revalidate = 30;

export default async function PaginasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [paginas, sp] = await Promise.all([getPaginas(), searchParams]);
  return (
    <main>
      <Header titulo="Páginas" subtitulo="Enlaces útiles y de confianza" />
      <PaginasLista paginas={paginas} initialQ={sp.q} />
    </main>
  );
}
