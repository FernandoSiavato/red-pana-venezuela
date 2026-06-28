"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Inicio", icon: "🏠" },
  { href: "/insumos", label: "Insumos", icon: "📦" },
  { href: "/albergues", label: "Albergues", icon: "🏥" },
  { href: "/paginas", label: "Páginas", icon: "🔗" },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 bg-tarjeta border-t border-gray-200"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Navegación principal"
    >
      <ul className="mx-auto flex max-w-md">
        {ITEMS.map((it) => {
          const activo =
            it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
          return (
            <li key={it.href} className="flex-1">
              <Link
                href={it.href}
                className={`flex h-[64px] flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors ${
                  activo ? "text-pana-azul" : "text-tinta-suave"
                }`}
                aria-current={activo ? "page" : undefined}
              >
                <span className="text-2xl leading-none" aria-hidden>
                  {it.icon}
                </span>
                <span>{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
