// Header de marca PANA. Aparece arriba de cada pantalla.
export default function Header({
  titulo,
  subtitulo,
}: {
  titulo: string;
  subtitulo?: string;
}) {
  return (
    <header className="sticky top-0 z-40 bg-pana-amarillo">
      <div
        className="mx-auto max-w-md px-4 pb-4"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 1.5rem)" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden>
            🤝
          </span>
          <span className="text-sm font-bold tracking-tight text-tinta">
            Red Pana Venezuela
          </span>
        </div>
        <h1 className="mt-2 text-2xl font-extrabold leading-tight text-tinta">
          {titulo}
        </h1>
        {subtitulo ? (
          <p className="mt-0.5 text-sm text-tinta/80">{subtitulo}</p>
        ) : null}
      </div>
    </header>
  );
}
