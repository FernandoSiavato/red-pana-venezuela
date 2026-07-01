// Isotipo "Nodo Pana" de Red Pana Venezuela.
export default function Logo({
  size = 32,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label="Red Pana Venezuela"
      className={className}
    >
      <defs>
        <linearGradient id="rp-logo-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2563EB" />
          <stop offset="1" stopColor="#1E3A8A" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#rp-logo-bg)" />
      <g stroke="#fff" strokeWidth="3.4" strokeLinecap="round">
        <line x1="32" y1="38" x2="50" y2="54" />
        <line x1="68" y1="38" x2="50" y2="54" />
        <line x1="32" y1="38" x2="68" y2="38" />
        <line x1="50" y1="54" x2="50" y2="72" />
      </g>
      <g fill="#fff">
        <circle cx="32" cy="38" r="7" />
        <circle cx="68" cy="38" r="7" />
        <circle cx="50" cy="72" r="7" />
      </g>
      <circle cx="50" cy="54" r="8.5" fill="#F6B600" />
    </svg>
  );
}
