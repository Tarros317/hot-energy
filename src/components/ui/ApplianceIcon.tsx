import { cn } from '@/lib/utils';

/**
 * Line-icon set for the calculator, drawn specifically for this page — one
 * icon per appliance id in src/lib/appliances.ts.
 *
 * House rules so the grid reads as one family: 24×24 grid, 1.5 stroke, round
 * caps and joins, no fills, currentColor only. Icons are decorative — every
 * tile also carries the appliance name in text, so they are aria-hidden.
 */

const S = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const ICONS: Record<string, React.ReactNode> = {
  // ── Життєзабезпечення ──────────────────────────────────────────────────
  fridge: (
    <>
      <rect x="5" y="2.8" width="14" height="18.4" rx="2" {...S} />
      <path d="M5 10.2h14M8.2 6.2v2M8.2 12.6v2.6" {...S} />
    </>
  ),
  freezer: (
    <>
      <rect x="4.6" y="3.4" width="14.8" height="17.2" rx="2" {...S} />
      <path d="M12 7.4v9.2M8.6 9.4l6.8 4.6M15.4 9.4l-6.8 4.6" {...S} />
    </>
  ),
  light: (
    <>
      <path
        d="M12 2.8a6.2 6.2 0 0 0-3.6 11.3c.6.4 1 1.1 1 1.8v.6h5.2v-.6c0-.7.4-1.4 1-1.8A6.2 6.2 0 0 0 12 2.8Z"
        {...S}
      />
      <path d="M9.4 18.6h5.2M10.4 21.2h3.2" {...S} />
    </>
  ),
  router: (
    <>
      <rect x="2.4" y="14" width="19.2" height="5.6" rx="1.6" {...S} />
      <path d="M7 14 5.2 9.4M17 14l1.8-4.6" {...S} />
      <path d="M9 6.6a5 5 0 0 1 6 0" {...S} />
      <path d="M6.4 16.8h.01M9.2 16.8h.01" {...S} />
    </>
  ),
  boiler: (
    <>
      <rect x="4.8" y="2.8" width="14.4" height="13.4" rx="2" {...S} />
      <path
        d="M12 6.6c1.6 1.7 2.2 2.9 2.2 3.9a2.2 2.2 0 1 1-4.4 0c0-1 .6-2.2 2.2-3.9Z"
        {...S}
      />
      <path d="M8.6 16.2v5M15.4 16.2v5" {...S} />
    </>
  ),
  pumpCirc: (
    <>
      <circle cx="12" cy="12" r="5" {...S} />
      <path d="M2.6 12h4.4M17 12h4.4" {...S} />
      <path d="M10 12h4M12.6 10.6 14 12l-1.4 1.4" {...S} />
      <path d="M12 4.4v2.6" {...S} />
    </>
  ),
  wellPump: (
    <>
      <path d="M12 2.6s5.2 5.6 5.2 9.2a5.2 5.2 0 0 1-10.4 0C6.8 8.2 12 2.6 12 2.6Z" {...S} />
      <path d="M12 15.4v-4M10.5 12.9 12 11.4l1.5 1.5" {...S} />
      <path d="M8.4 21h7.2" {...S} />
    </>
  ),
  security: (
    <>
      <path
        d="M2.9 9.3 16.6 5.5a1 1 0 0 1 1.24.7l.85 3.1a1 1 0 0 1-.7 1.22L4.3 14.3a1 1 0 0 1-1.23-.7l-.86-3.1a1 1 0 0 1 .69-1.2Z"
        {...S}
      />
      <path d="m18.9 8.4 2.7-1.1M7.8 13.7 9 17.6M6.6 18h4.8" {...S} />
    </>
  ),
  charging: (
    <>
      <rect x="6.4" y="2.4" width="11.2" height="19.2" rx="2.4" {...S} />
      <path d="M13 6.6 10 12h3.2l-1 5.2 4-6.2H13z" {...S} />
    </>
  ),

  // ── Робота і зв’язок ───────────────────────────────────────────────────
  tv: (
    <>
      <rect x="2.2" y="4.4" width="19.6" height="12.4" rx="1.8" {...S} />
      <path d="M8.4 20.6h7.2M12 16.8v3.8" {...S} />
    </>
  ),
  laptop: (
    <>
      <path d="M5 5.6h14a1 1 0 0 1 1 1v8.2H4V6.6a1 1 0 0 1 1-1Z" {...S} />
      <path d="M2 14.8h20l-1.3 2.6a1 1 0 0 1-.9.6H4.2a1 1 0 0 1-.9-.6z" {...S} />
    </>
  ),
  pc: (
    <>
      <rect x="2.6" y="3.6" width="6" height="16.8" rx="1.4" {...S} />
      <path d="M4.8 7h1.6M4.8 9.4h1.6" {...S} />
      <rect x="11" y="5.2" width="10.4" height="8.4" rx="1.4" {...S} />
      <path d="M16.2 13.6v3M13.2 16.6h6" {...S} />
    </>
  ),
  console: (
    <>
      <path
        d="M7.4 8.4h9.2a5 5 0 0 1 4.85 6.2l-.45 1.8a2.4 2.4 0 0 1-4.3.75L15.4 15.2H8.6L7.3 17.15a2.4 2.4 0 0 1-4.3-.75l-.45-1.8A5 5 0 0 1 7.4 8.4Z"
        {...S}
      />
      <path d="M5.6 12.2h2.6M6.9 10.9v2.6M15.9 11.6h.01M17.9 13.2h.01" {...S} />
    </>
  ),
  starlink: (
    <>
      <rect x="4" y="5.6" width="16" height="8.2" rx="2" {...S} />
      <path d="M12 13.8v5M9 19.4h6" {...S} />
      <path d="M7.6 9.6h4.6" {...S} />
    </>
  ),

  // ── Кухня ──────────────────────────────────────────────────────────────
  kettle: (
    <>
      <path d="M6.6 9h9.6v9a2.2 2.2 0 0 1-2.2 2.2H8.8A2.2 2.2 0 0 1 6.6 18V9Z" {...S} />
      <path d="M9.2 9V7.6a1 1 0 0 1 1-1h2.6a1 1 0 0 1 1 1V9" {...S} />
      <path d="m16.2 10.6 3.4-3.3" {...S} />
      <path d="M6.6 11.6H5a2.2 2.2 0 0 0-2.2 2.2v1" {...S} />
    </>
  ),
  microwave: (
    <>
      <rect x="1.8" y="5.4" width="20.4" height="13.2" rx="1.8" {...S} />
      <path d="M16.2 5.4v13.2" {...S} />
      <path d="M18.8 9.4h.01M18.8 12.6h.01M6 15.2h6.6" {...S} />
    </>
  ),
  coffee: (
    <>
      <path d="M3.8 8.4h12.4v4.8a5 5 0 0 1-5 5H8.8a5 5 0 0 1-5-5V8.4Z" {...S} />
      <path d="M16.2 9.8h1.4a2.6 2.6 0 0 1 0 5.2h-1.4" {...S} />
      <path d="M7.6 5.4V3.2M11.8 5.4V3.2M3.4 21h13.2" {...S} />
    </>
  ),
  multicooker: (
    <>
      <path d="M5 10.4h14v6.8a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-6.8Z" {...S} />
      <path d="M3.6 10.4h16.8M12 7.4v3M10.8 6.4h2.4" {...S} />
      <path d="M9 15.4h6" {...S} />
    </>
  ),
  toaster: (
    <>
      <rect x="2.4" y="9.6" width="19.2" height="9.6" rx="2.2" {...S} />
      <path d="M8 9.6V6.6h2.6v3M13.4 9.6V6.6H16v3" {...S} />
      <path d="M5.2 14.4h.01M19 12.6v3.4" {...S} />
    </>
  ),
  dishwasher: (
    <>
      <rect x="3.4" y="3.2" width="17.2" height="17.6" rx="2" {...S} />
      <path d="M3.4 8h17.2M17 5.6h.01M14 5.6h.01" {...S} />
      <path d="M7 12h10M7 15.6h10" {...S} />
    </>
  ),

  // ── Побут і клімат ─────────────────────────────────────────────────────
  washer: (
    <>
      <rect x="3.4" y="3.2" width="17.2" height="17.6" rx="2" {...S} />
      <path d="M3.4 8h17.2M6.4 5.6h.01M9.4 5.6h.01" {...S} />
      <circle cx="12" cy="14.4" r="4.2" {...S} />
      <path d="M9.6 13.4c1.6 1.4 3.2 1.4 4.8 0" {...S} />
    </>
  ),
  iron: (
    <>
      <path d="M3.6 16.8h15.6a1 1 0 0 0 1-1v-2.4a4.4 4.4 0 0 0-4.4-4.4h-4.4a7.8 7.8 0 0 0-7.8 6.6 1 1 0 0 0 1 1.2Z" {...S} />
      <path d="M11.8 9V7.2a2 2 0 0 1 2-2h4.4M4.6 20.4h13.4" {...S} />
    </>
  ),
  vacuum: (
    <>
      <path d="M6.4 21h8.2" {...S} />
      <path d="M9.4 21V9.4" {...S} />
      <path d="M9.4 9.4h4.4a3.2 3.2 0 0 0 0-6.4h-1.2" {...S} />
      <path d="M6 21a3.4 3.4 0 0 1 6.8 0" {...S} />
      <path d="M16.6 13.4h3.8" {...S} />
    </>
  ),
  hairdryer: (
    <>
      <path d="M3.4 7.8h9.4a4.6 4.6 0 0 1 0 9.2H3.4a1 1 0 0 1-1-1V8.8a1 1 0 0 1 1-1Z" {...S} />
      <path d="m8.2 17 1.5 3.9a1 1 0 0 0 .94.65h1.96" {...S} />
      <path d="M18.6 10.4h2.8M18.6 14.4h2.8" {...S} />
    </>
  ),
  ac: (
    <>
      <rect x="2.4" y="5" width="19.2" height="7" rx="1.8" {...S} />
      <path d="M5 9.8h14" {...S} />
      <path d="M6.8 15.4c1.4 1.5 2.8 1.5 4.2 0M13.4 15.4c1.4 1.5 2.8 1.5 4.2 0" {...S} />
      <path d="M6.8 19.2c1.4 1.5 2.8 1.5 4.2 0M13.4 19.2c1.4 1.5 2.8 1.5 4.2 0" {...S} />
    </>
  ),
  heater: (
    <>
      <path d="M4.4 6v12M8.8 6v12M13.2 6v12M17.6 6v12" {...S} />
      <path d="M3 8.6h18M3 15.4h18" {...S} />
      <path d="M5.6 18v2.6M18 18v2.6" {...S} />
    </>
  ),
  fan: (
    <>
      <circle cx="12" cy="12" r="1.9" {...S} />
      <g {...S}>
        <path d="M12 10.1c0-3.4 1.1-6.1 3.4-6.1 1.7 0 2.6 1.5 2.1 3.3-.6 2.1-2.7 3.3-5.5 3.8" />
        <path
          d="M12 10.1c0-3.4 1.1-6.1 3.4-6.1 1.7 0 2.6 1.5 2.1 3.3-.6 2.1-2.7 3.3-5.5 3.8"
          transform="rotate(120 12 12)"
        />
        <path
          d="M12 10.1c0-3.4 1.1-6.1 3.4-6.1 1.7 0 2.6 1.5 2.1 3.3-.6 2.1-2.7 3.3-5.5 3.8"
          transform="rotate(240 12 12)"
        />
      </g>
    </>
  ),
  waterHeater: (
    <>
      <rect x="6.2" y="3" width="11.6" height="16.4" rx="2.4" {...S} />
      <path d="M6.2 8h11.6" {...S} />
      <circle cx="12" cy="13.6" r="2.2" {...S} />
      <path d="M9 19.4v2M15 19.4v2" {...S} />
    </>
  ),
};

const FALLBACK = (
  <>
    <rect x="4" y="4" width="16" height="16" rx="3" {...S} />
    <path d="M12 8.4 9.6 12.4h2.6l-.8 3.6 3.2-4.4h-2.6z" {...S} />
  </>
);

export function ApplianceIcon({ id, className }: { id: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn('size-6', className)}
      aria-hidden
      focusable="false"
    >
      {ICONS[id] ?? FALLBACK}
    </svg>
  );
}
