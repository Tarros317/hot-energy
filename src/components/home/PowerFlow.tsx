'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

/**
 * Interactive diagram of the inverter's output-priority modes.
 *
 * The Sinus PRO Ultra can be told where to take power from first — that single
 * setting is the difference between «резервне ДБЖ» and «сонячна станція», and
 * it is the thing owners most often get wrong. Tapping a mode re-lights the
 * paths so the rule becomes obvious without a paragraph of manual.
 */

type ModeId = 'utl' | 'sbu' | 'sol';

const MODES: {
  id: ModeId;
  code: string;
  label: string;
  blurb: string;
  /** Which sources feed the house in this mode, in priority order. */
  active: ('grid' | 'solar' | 'battery')[];
}[] = [
  {
    id: 'utl',
    code: 'UTL',
    label: 'Пріоритет мережі',
    blurb:
      'Поки світло є — дім живиться від мережі, а акумулятор просто стоїть зарядженим. Зникло світло — навантаження переходить на батарею. Це класичний режим ДБЖ і саме те, що потрібно більшості квартир.',
    active: ['grid', 'battery'],
  },
  {
    id: 'sol',
    code: 'SOL',
    label: 'Спочатку сонце',
    blurb:
      'Панелі закривають споживання вдень, мережа добирає різницю, а батарея залишається недоторканою до вечора. Ресурс акумулятора витрачається повільніше.',
    active: ['solar', 'grid'],
  },
  {
    id: 'sbu',
    code: 'SBU',
    label: 'Сонце → батарея → мережа',
    blurb:
      'Максимальна незалежність: спочатку сонце, потім накопичена енергія, і лише коли обидва джерела вичерпані — мережа. Режим для тих, хто рахує кіловат-години.',
    active: ['solar', 'battery', 'grid'],
  },
];

const SOURCES = [
  { id: 'grid' as const, label: 'Мережа', hint: '230 В' },
  { id: 'solar' as const, label: 'Панелі', hint: 'до 1,5 кВт' },
  { id: 'battery' as const, label: 'Акумулятор', hint: '4 кВт·год' },
];

/** y coordinate of each source row in the 400×260 viewBox. */
const ROW_Y: Record<string, number> = { grid: 52, solar: 130, battery: 208 };

export function PowerFlow() {
  const reduce = useReducedMotion();
  const [mode, setMode] = useState<ModeId>('utl');
  const current = MODES.find((m) => m.id === mode)!;

  return (
    <div className="panel overflow-hidden rounded-3xl p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ash">
          Режим роботи інвертора
        </p>
        <div role="tablist" aria-label="Режими роботи" className="flex gap-1.5">
          {MODES.map((m) => (
            <button
              key={m.id}
              role="tab"
              type="button"
              aria-selected={mode === m.id}
              onClick={() => setMode(m.id)}
              className={cn(
                'relative inline-flex min-h-11 cursor-pointer items-center rounded-lg px-3.5 font-mono text-[0.7rem] font-bold tracking-wide transition-colors',
                mode === m.id ? 'text-abyss' : 'text-mist hover:text-frost',
              )}
            >
              {mode === m.id && (
                <motion.span
                  layoutId="flow-tab"
                  transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                  className="absolute inset-0 -z-10 rounded-lg bg-gradient-to-b from-ember-300 to-ember-500"
                />
              )}
              {m.code}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-[1.25fr_1fr] sm:items-center">
        <svg viewBox="0 0 400 260" className="w-full" role="img" aria-label={`Схема: ${current.label}`}>
          <defs>
            <linearGradient id="flow-live" x1="0" y1="0" x2="400" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#F6850E" />
              <stop offset="1" stopColor="#FFC46B" />
            </linearGradient>
          </defs>

          {/* Source → inverter */}
          {SOURCES.map((s, i) => {
            const on = current.active.includes(s.id);
            const priority = current.active.indexOf(s.id);
            const y = ROW_Y[s.id];
            const d = `M112 ${y} H150 Q168 ${y} 168 ${y > 130 ? y - 22 : y < 130 ? y + 22 : y} V130 H182`;
            return (
              <g key={s.id}>
                <path
                  d={d}
                  fill="none"
                  stroke="#ffffff"
                  strokeOpacity="0.09"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                {on && (
                  <motion.path
                    d={d}
                    fill="none"
                    stroke="url(#flow-live)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray="5 12"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    style={
                      reduce
                        ? undefined
                        : {
                            animation: 'flow 1.6s steps(16) infinite',
                            animationDelay: `${priority * -0.4}s`,
                          }
                    }
                  />
                )}
              </g>
            );
          })}

          {/* Inverter → house */}
          <path
            d="M262 130 H322"
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.09"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M262 130 H322"
            fill="none"
            stroke="url(#flow-live)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="6 12"
            style={reduce ? undefined : { animation: 'flow 1.2s steps(12) infinite' }}
          />

          {/* Source nodes */}
          {SOURCES.map((s) => {
            const on = current.active.includes(s.id);
            const rank = current.active.indexOf(s.id);
            return (
              <g key={s.id}>
                <rect
                  x="8"
                  y={ROW_Y[s.id] - 22}
                  width="104"
                  height="44"
                  rx="10"
                  fill={on ? 'rgba(255,165,36,0.10)' : 'rgba(255,255,255,0.03)'}
                  stroke={on ? 'rgba(255,165,36,0.45)' : 'rgba(255,255,255,0.09)'}
                  strokeWidth="1"
                />
                <text
                  x="22"
                  y={ROW_Y[s.id] - 2}
                  fill={on ? '#FFE0B2' : '#76838F'}
                  fontSize="12.5"
                  fontWeight="600"
                >
                  {s.label}
                </text>
                <text x="22" y={ROW_Y[s.id] + 14} fill="#566373" fontSize="10.5">
                  {s.hint}
                </text>
                {on && (
                  <>
                    <circle cx="98" cy={ROW_Y[s.id] - 10} r="8" fill="rgba(255,165,36,0.16)" />
                    <text
                      x="98"
                      y={ROW_Y[s.id] - 6.5}
                      fill="#FFC46B"
                      fontSize="9.5"
                      fontWeight="700"
                      textAnchor="middle"
                    >
                      {rank + 1}
                    </text>
                  </>
                )}
              </g>
            );
          })}

          {/* Inverter */}
          <rect
            x="182"
            y="96"
            width="80"
            height="68"
            rx="12"
            fill="rgba(255,165,36,0.08)"
            stroke="rgba(255,165,36,0.5)"
            strokeWidth="1.2"
          />
          <text x="222" y="124" fill="#FFE0B2" fontSize="11.5" fontWeight="700" textAnchor="middle">
            Інвертор
          </text>
          <text x="222" y="142" fill="#A7B4C4" fontSize="10" textAnchor="middle">
            1500 Вт
          </text>

          {/* House */}
          <g>
            <rect
              x="322"
              y="100"
              width="70"
              height="60"
              rx="12"
              fill="rgba(53,227,155,0.08)"
              stroke="rgba(53,227,155,0.4)"
              strokeWidth="1.2"
            />
            <path
              d="M344 128 l13-12 13 12 v18 h-26 z"
              fill="none"
              stroke="#86F7C4"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </g>
        </svg>

        <motion.div key={mode} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
          <p className="font-heading text-base text-cloud">{current.label}</p>
          <p className="mt-2.5 text-[0.85rem] leading-relaxed text-mist">{current.blurb}</p>
        </motion.div>
      </div>
    </div>
  );
}
