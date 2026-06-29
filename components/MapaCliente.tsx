"use client";

import { useEffect, useRef } from "react";
import type { PuntoMapa } from "@/lib/zonas";

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global { interface Window { L?: any } }

function cargarLeaflet(): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (window.L) return resolve(window.L);
    if (!document.querySelector(`link[data-leaflet]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = LEAFLET_CSS;
      link.setAttribute("data-leaflet", "1");
      document.head.appendChild(link);
    }
    const prev = document.querySelector(`script[data-leaflet]`) as HTMLScriptElement | null;
    if (prev) {
      prev.addEventListener("load", () => resolve(window.L));
      return;
    }
    const s = document.createElement("script");
    s.src = LEAFLET_JS;
    s.async = true;
    s.setAttribute("data-leaflet", "1");
    s.onload = () => resolve(window.L);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function esc(t: unknown): string {
  return String(t ?? "").replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string)
  );
}

export default function MapaCliente({
  puntos,
  albergues,
}: {
  puntos: PuntoMapa[];
  albergues: PuntoMapa[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);

  useEffect(() => {
    let cancelado = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cargarLeaflet().then((L: any) => {
      if (cancelado || !ref.current || mapRef.current || !L) return;
      const map = L.map(ref.current, { zoomControl: true }).setView([10.49, -66.90], 11);
      mapRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);
      // Delimitar a la zona metropolitana mapeada (Caracas, Miranda, La Guaira)
      map.setMaxBounds([
        [10.0, -67.35],
        [10.85, -66.35],
      ]);
      map.setMinZoom(10);

      puntos.forEach((p) => {
        const icon = L.divIcon({
          className: "",
          html: `<div class="num" style="background:${p.color}">${p.id}</div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });
        const tipo = p.tipo === "INSUMO+SOLICITUD" ? "🟡 Insumo+Solicitud" : "🔴 Solicitud";
        const html =
          `<div class="pop"><b>#${p.id} ${esc(p.titulo)}</b>` +
          `<div class="meta">${tipo} · ${esc(p.cat)}${p.urg ? " · " + esc(p.urg) : ""}</div>` +
          `<div class="meta">📍 ${esc(p.zona)}</div>` +
          (p.fecha ? `<div class="meta">📅 ${esc(p.fecha)}</div>` : "") +
          (p.contacto ? `<div class="tel">📞 ${esc(p.contacto)}</div>` : "") +
          `</div>`;
        L.marker([p.lat, p.lng], { icon }).addTo(map).bindPopup(html);
      });

      albergues.forEach((p) => {
        const icon = L.divIcon({
          className: "",
          html: `<div class="plc" style="background:#4f46e5">🏥</div>`,
          iconSize: [30, 26],
          iconAnchor: [15, 13],
        });
        const html =
          `<div class="pop"><b>🏥 ${esc(p.titulo)}</b>` +
          `<div class="meta">Albergue${p.cat ? " · " + esc(p.cat) : ""}</div>` +
          `<div class="meta">📍 ${esc(p.zona)}</div>` +
          (p.contacto ? `<div class="tel">📞 ${esc(p.contacto)}</div>` : "") +
          `<div class="meta" style="color:#9ca3af">Ubicación aproximada</div></div>`;
        L.marker([p.lat, p.lng], { icon }).addTo(map).bindPopup(html);
      });
    });

    return () => {
      cancelado = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [puntos, albergues]);

  return <div ref={ref} className="h-full w-full" />;
}
