import { normalizarTelefono } from "@/lib/types";

/** Botones grandes para llamar / escribir por WhatsApp. */
export function BotonesContacto({
  contacto,
  mensaje,
}: {
  contacto: string | null;
  mensaje?: string;
}) {
  const tel = normalizarTelefono(contacto);
  if (!tel) return null;
  const texto = encodeURIComponent(
    mensaje ?? "¡Hola! Te escribo desde Red Pana Venezuela 🤝"
  );
  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      <a
        href={`tel:+${tel}`}
        className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-pana-azul text-sm font-semibold text-white active:scale-[0.98]"
      >
        📞 Llamar
      </a>
      <a
        href={`https://wa.me/${tel}?text=${texto}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-pana-verde text-sm font-semibold text-white active:scale-[0.98]"
      >
        💬 WhatsApp
      </a>
    </div>
  );
}

/** Botón "Cómo llegar" (abre Google Maps). */
export function BotonComoLlegar({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 flex h-11 items-center justify-center gap-1.5 rounded-xl bg-pana-azul text-sm font-semibold text-white active:scale-[0.98]"
    >
      📍 Cómo llegar
    </a>
  );
}

/** Etiqueta de estado/categoría. */
export function Badge({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}
    >
      {children}
    </span>
  );
}
