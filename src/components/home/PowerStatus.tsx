'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';
import { inverter } from '@/lib/kit';

/**
 * A live mock of the inverter's own status panel, looping the moment the whole
 * product exists for: the grid drops and the house does not notice.
 *
 * grid (4 s) → switch (0.9 s) → battery (7.5 s) → back. The switch frame is
 * the point of the animation: it prints the real 10 ms transfer time from the
 * datasheet while the output stays at 230 V.
 *
 * Under reduced motion the loop is pinned to the battery frame — the same
 * message, without the flashing.
 */

type Phase = 'grid' | 'switch' | 'battery';

const DURATIONS: Record<Phase, number> = { grid: 4000, switch: 900, battery: 7500 };
const NEXT: Record<Phase, Phase> = { grid: 'switch', switch: 'battery', battery: 'grid' };

export function PowerStatus({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  // The telemetry loop re-renders this panel every 620 ms for the page's whole
  // lifetime — including while the visitor reads the FAQ three screens down.
  // Gate the timers on visibility; the panel freezes mid-state off-screen and
  // resumes exactly where it was, which nobody can observe.
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { amount: 0.15 });
  const [loopPhase, setLoopPhase] = useState<Phase>('grid');
  const [charge, setCharge] = useState(74);

  // Reduced motion pins the panel to the battery frame — same message, no
  // flashing — so it is DERIVED rather than written into state from an effect.
  const phase: Phase = reduce ? 'battery' : loopPhase;

  useEffect(() => {
    if (reduce || !inView) return;
    const t = setTimeout(() => setLoopPhase(NEXT[loopPhase]), DURATIONS[loopPhase]);
    return () => clearTimeout(t);
  }, [loopPhase, reduce, inView]);

  // Charge creeps up on mains and down on battery — slow enough to read as
  // real telemetry rather than a progress bar toy.
  useEffect(() => {
    if (reduce || !inView) return;
    const id = setInterval(() => {
      setCharge((c) => {
        if (phase === 'grid') return Math.min(96, c + 1);
        if (phase === 'battery') return Math.max(41, c - 1);
        return c;
      });
    }, 620);
    return () => clearInterval(id);
  }, [phase, reduce, inView]);

  const onGrid = phase === 'grid';
  // 4,02 kWh of usable energy against a ~600 W household draw.
  const hoursLeft = (charge / 100) * 6.1;
  const h = Math.floor(hoursLeft);
  const m = Math.round((hoursLeft - h) * 60);

  return (
    <div
      // No backdrop-blur here: `.panel` paints an OPAQUE #0d1117 base, so the
      // blur pass was sampling a backdrop that is then covered 100 % — a full
      // render pass per frame for pixels that can never be seen. `contain:
      // paint` keeps the 620 ms telemetry ticks from dirtying tiles of the
      // shared hero surface this panel sits on.
      ref={rootRef}
      style={{ contain: 'paint' }}
      className={cn('panel relative overflow-hidden rounded-2xl p-4 sm:p-5', className)}
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ember-400/60 to-transparent"
      />

      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-ash">
          Sinus PRO Ultra · статус
        </p>
        <span className="flex items-center gap-1.5">
          <span
            className={cn('size-1.5 rounded-full', onGrid ? 'bg-mist' : 'bg-volt-400')}
            style={{ animation: 'blink-dot 1.8s ease-in-out infinite' }}
          />
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-mist">
            {onGrid ? 'Мережа' : 'Батарея'}
          </span>
        </span>
      </div>

      <dl className="mt-4 space-y-3">
        <Row
          label="Мережа 230 В"
          value={onGrid ? 'Є' : 'Відсутня'}
          tone={onGrid ? 'ok' : 'off'}
        />
        <Row label="Вихід на дім" value="230 В · 50 Гц" tone="ok" />
        <Row
          label="Режим"
          value={onGrid ? 'Заряджання АКБ' : 'Живлення від АКБ'}
          tone={onGrid ? 'muted' : 'ember'}
        />
      </dl>

      {/* Battery gauge */}
      <div className="mt-5">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-ash">
            Заряд банку
          </span>
          <span className="tnum text-sm font-semibold text-frost">{charge}%</span>
        </div>
        <div className="mt-2 flex gap-1" role="presentation">
          {Array.from({ length: 12 }).map((_, i) => {
            const lit = charge >= ((i + 1) / 12) * 100 - 4;
            return (
              <span
                key={i}
                className={cn(
                  'h-2.5 flex-1 rounded-[3px]',
                  lit
                    ? onGrid
                      ? 'bg-volt-400/85'
                      : 'bg-gradient-to-b from-ember-300 to-ember-500'
                    : 'bg-white/8',
                )}
                style={
                  lit
                    ? {
                        animation: 'seg-breathe 2.4s ease-in-out infinite',
                        animationDelay: `${i * 0.06}s`,
                      }
                    : undefined
                }
              />
            );
          })}
        </div>
      </div>

      {/* Headline readout */}
      <div className="mt-5 flex items-end justify-between gap-4 border-t border-white/8 pt-4">
        <div>
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-ash">
            Вистачить ще
          </p>
          <p className="tnum mt-1 text-2xl font-bold text-cloud">
            {h} год {String(m).padStart(2, '0')} хв
          </p>
        </div>
        <AnimatePresence mode="wait">
          {phase === 'switch' ? (
            <motion.span
              key="switch"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              className="rounded-lg border border-ember-400/50 bg-ember-400/15 px-2.5 py-1.5 font-mono text-[0.65rem] font-bold tracking-wide text-ember-200"
            >
              ПЕРЕМИКАННЯ {inverter.transferMsPc} мс
            </motion.span>
          ) : (
            <motion.span
              key="ok"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="rounded-lg border border-volt-400/30 bg-volt-400/10 px-2.5 py-1.5 font-mono text-[0.65rem] font-bold tracking-wide text-volt-300"
            >
              БЕЗ ЗБОЇВ
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'ok' | 'off' | 'ember' | 'muted';
}) {
  const toneClass = {
    ok: 'text-volt-300',
    off: 'text-alarm-300',
    ember: 'text-ember-300',
    muted: 'text-mist',
  }[tone];

  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <dt className="text-ash">{label}</dt>
      <dd className={cn('font-mono text-[0.8rem] font-medium', toneClass)}>{value}</dd>
    </div>
  );
}
