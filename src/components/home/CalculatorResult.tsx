'use client';

import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  AlertTriangle,
  BatteryCharging,
  ChevronDown,
  Info,
  Minus,
  Plug,
  Plus,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ApplianceIcon } from '@/components/ui/ApplianceIcon';
import { battery, inverter, kit } from '@/lib/kit';
import { formatHours, type CalcResult, type Sustainability } from '@/lib/calc';

/* ── Autonomy dial ───────────────────────────────────────────────────────
   A 250° arc scaled 0–24 h. Past 24 h the arc simply stays full: the point of
   the dial is "does this cover tonight", not a linear reading to infinity.

   The `compact` variant is what the sticky panel uses. It is not just smaller —
   it drops the caption lines, which move out beside the dial, because the panel
   has to fit between the header and the fold at 1280×720. */

const R = 78;
const SWEEP = 250;
const CIRC = 2 * Math.PI * R;
const ARC = (SWEEP / 360) * CIRC;

export function AutonomyDial({
  hours,
  over,
  compact = false,
}: {
  hours: number;
  over: boolean;
  compact?: boolean;
}) {
  const reduce = useReducedMotion();
  const capped = Math.min(Number.isFinite(hours) ? hours : 0, 24);
  const progress = capped / 24;
  const { value, unit } = formatHours(hours);

  const finite = Number.isFinite(hours) && hours > 0;
  const h = finite ? Math.floor(hours) : 0;
  const m = finite ? Math.round((hours - h) * 60) : 0;

  return (
    <div className={cn('relative mx-auto w-full', compact ? 'max-w-[9.5rem]' : 'max-w-[15rem]')}>
      <svg viewBox="0 0 200 200" className="w-full -rotate-[125deg]">
        <defs>
          <linearGradient id="dial-fill" x1="0" y1="0" x2="200" y2="200">
            <stop offset="0" stopColor="#FFD79A" />
            <stop offset="0.55" stopColor="#FFA524" />
            <stop offset="1" stopColor="#F6850E" />
          </linearGradient>
        </defs>
        <circle
          cx="100"
          cy="100"
          r={R}
          fill="none"
          stroke="rgb(255 255 255 / 0.07)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${ARC} ${CIRC}`}
        />
        <motion.circle
          cx="100"
          cy="100"
          r={R}
          fill="none"
          stroke={over ? '#FF6B5B' : 'url(#dial-fill)'}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${ARC * progress} ${CIRC}`}
          initial={false}
          animate={{ strokeDasharray: `${ARC * progress} ${CIRC}` }}
          transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 90, damping: 20 }}
        />
        {[4, 8, 12, 16, 20].map((t) => {
          const a = ((t / 24) * SWEEP * Math.PI) / 180;
          return (
            <circle
              key={t}
              cx={100 + Math.cos(a) * R}
              cy={100 + Math.sin(a) * R}
              r="2"
              fill="rgb(255 255 255 / 0.28)"
            />
          );
        })}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center pt-2 text-center">
        {compact ? (
          finite ? (
            <>
              <p className="tnum text-[1.35rem] font-bold leading-none text-cloud">
                {h > 0 ? h : m}
                <span className="ml-0.5 text-[0.7rem] font-semibold text-ember-400">
                  {h > 0 ? 'год' : 'хв'}
                </span>
              </p>
              {h > 0 && m > 0 && (
                <p className="tnum mt-1 text-[0.72rem] leading-none text-mist">
                  {String(m).padStart(2, '0')} хв
                </p>
              )}
            </>
          ) : (
            <p className="text-[1.35rem] font-bold leading-none text-dim">—</p>
          )
        ) : (
          <>
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-ash">
              Автономність
            </p>
            <p className="mt-1.5 flex items-baseline gap-1">
              <span className="tnum text-[2.1rem] font-bold leading-none text-cloud">{value}</span>
              {unit && <span className="text-sm font-semibold text-ember-400">{unit}</span>}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Battery bank picker ─────────────────────────────────────────────── */

export function BatteryPicker({
  value,
  onChange,
  compact = false,
}: {
  value: number;
  onChange: (n: number) => void;
  compact?: boolean;
}) {
  const reduce = useReducedMotion();

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ash">
          Акумуляторів у банку
        </p>
        <p className="tnum text-sm font-semibold text-frost">
          {((battery.energyWh * value) / 1000).toFixed(2).replace('.', ',')} кВт·год
        </p>
      </div>

      <div className={cn('mt-2.5 flex gap-2', compact && 'gap-1.5')}>
        {Array.from({ length: kit.maxBatteries }).map((_, i) => {
          const n = i + 1;
          const active = n <= value;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n === value ? Math.max(1, n - 1) : n)}
              aria-pressed={active}
              aria-label={`${n} ${plural(n, 'акумулятор', 'акумулятори', 'акумуляторів')}`}
              className={cn(
                'group relative flex-1 cursor-pointer rounded-lg border transition-colors',
                compact ? 'h-10' : 'h-14',
                active
                  ? 'border-ember-400/60 bg-ember-400/10'
                  : 'border-white/10 bg-white/[0.02] hover:border-white/25',
              )}
            >
              <span className="absolute inset-1.5 flex flex-col justify-end gap-[3px] overflow-hidden rounded">
                {Array.from({ length: compact ? 2 : 3 }).map((__, k) => (
                  <motion.span
                    key={k}
                    className={cn(
                      'h-full rounded-[2px]',
                      active ? 'bg-gradient-to-r from-ember-500 to-ember-300' : 'bg-white/8',
                    )}
                    initial={false}
                    animate={{ opacity: active ? 1 : 0.5 }}
                    transition={reduce ? { duration: 0 } : { duration: 0.25, delay: k * 0.04 }}
                  />
                ))}
              </span>
              <span
                className={cn(
                  'absolute -top-1.5 left-1/2 h-1.5 w-4 -translate-x-1/2 rounded-t-sm transition-colors',
                  active ? 'bg-ember-400' : 'bg-white/12',
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Load gauge ──────────────────────────────────────────────────────── */

export function LoadGauge({ result, compact = false }: { result: CalcResult; compact?: boolean }) {
  const reduce = useReducedMotion();
  // The bar runs to the surge rating so the continuous limit sits at 50 %.
  const scale = inverter.peakVA;
  const pct = Math.min(100, (result.peakW / scale) * 100);
  const nominalPct = (inverter.powerW / scale) * 100;

  const tone = result.overContinuous
    ? 'from-alarm-500 to-alarm-400'
    : result.loadRatio > 0.8
      ? 'from-ember-500 to-ember-300'
      : 'from-volt-500 to-volt-300';

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ash">
          {compact ? 'Навантаження' : 'Одночасне навантаження'}
        </p>
        <p className="tnum text-sm font-semibold text-frost">
          {Math.round(result.peakW)} <span className="text-ash">/ {inverter.powerW} Вт</span>
        </p>
      </div>

      <div
        className={cn(
          'relative mt-2 overflow-hidden rounded-full bg-white/8',
          compact ? 'h-2' : 'h-3',
        )}
      >
        <motion.div
          className={cn('h-full rounded-full bg-gradient-to-r', tone)}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 22 }}
        />
        <span
          aria-hidden
          title={`Номінал ${inverter.powerW} Вт`}
          className="absolute inset-y-0 w-px bg-white/45"
          style={{ left: `${nominalPct}%` }}
        />
      </div>

      {!compact && (
        <div className="mt-1.5 flex justify-between font-mono text-[0.6rem] text-dim">
          <span>0</span>
          <span style={{ marginRight: `${100 - nominalPct - 6}%` }}>
            номінал {inverter.powerW} Вт
          </span>
          <span>пік {inverter.peakVA} ВА</span>
        </div>
      )}
    </div>
  );
}

/* ── Consumption breakdown, doubling as the editable selection list ──── */

const PREVIEW_LINES = 5;

export function Breakdown({
  result,
  onRemove,
}: {
  result: CalcResult;
  onRemove?: (id: string) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  // The inverter's own consumption is listed like any other consumer. Without
  // it this list does not add up to the draw the autonomy is computed from,
  // and a 15 W router lasting 78 h instead of 240 h looks like a bug.
  const max = Math.max(result.lines[0]?.avgW ?? 1, inverter.idleW);
  const visible = showAll ? result.lines : result.lines.slice(0, PREVIEW_LINES);
  const hidden = result.lines.length - visible.length;

  return (
    <>
      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {visible.map((line) => (
            <motion.li
              key={line.appliance.id}
              // Opacity only: tweening height mutates a layout property every
              // frame, and a preset switch enters/exits many rows at once —
              // each one reflowing the whole sticky panel per frame.
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <div className="flex items-center gap-2.5">
                <ApplianceIcon id={line.appliance.id} className="size-4 shrink-0 text-ember-400" />
                <span className="min-w-0 flex-1 truncate text-[0.8rem] text-mist">
                  {line.appliance.name}
                  {line.qty > 1 && <span className="text-dim"> ×{line.qty}</span>}
                </span>
                <span className="tnum shrink-0 text-[0.78rem] font-semibold text-frost">
                  {Math.round(line.avgW)} Вт
                </span>
                {onRemove && (
                  <button
                    type="button"
                    onClick={() => onRemove(line.appliance.id)}
                    aria-label={`Прибрати: ${line.appliance.name}`}
                    className="relative -my-1 grid size-7 shrink-0 cursor-pointer place-items-center rounded-md text-dim transition-colors before:absolute before:-inset-1.5 before:content-[''] hover:bg-white/5 hover:text-alarm-300"
                  >
                    <X aria-hidden className="size-3.5" />
                  </button>
                )}
              </div>
              <div className={cn('mt-1 h-1 overflow-hidden rounded-full bg-white/6', onRemove ? 'mr-9 ml-6.5' : 'ml-6.5')}>
                <motion.div
                  className="h-full rounded-full bg-ember-500/70"
                  initial={false}
                  animate={{ width: `${(line.avgW / max) * 100}%` }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      <div className="mt-2 flex items-center gap-2.5 border-t border-white/8 pt-2.5">
        <Plug aria-hidden className="size-4 shrink-0 text-ash" />
        <span className="min-w-0 flex-1 text-[0.8rem] text-mist">Сам інвертор</span>
        <span className="tnum shrink-0 text-[0.78rem] font-semibold text-frost">
          {inverter.idleW} Вт
        </span>
        {onRemove && <span className="w-7 shrink-0" />}
      </div>
      <div className={cn('mt-1 h-1 overflow-hidden rounded-full bg-white/6', onRemove ? 'ml-6.5 mr-9' : 'ml-6.5')}>
        <div
          className="h-full rounded-full bg-ash/50"
          style={{ width: `${(inverter.idleW / max) * 100}%` }}
        />
      </div>
      <p className="mt-2 text-[0.7rem] leading-snug text-dim">
        Інвертор споживає {inverter.idleW} Вт на власну роботу, поки живить дім. На малому
        навантаженні це і є головна витрата.
      </p>

      {(hidden > 0 || showAll) && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-2.5 inline-flex min-h-9 cursor-pointer items-center gap-1 text-[0.75rem] font-semibold text-ember-300 transition-colors hover:text-ember-200"
        >
          {showAll ? 'Згорнути' : `Показати всі (${result.lines.length})`}
          <ChevronDown aria-hidden className={cn('size-3.5 transition-transform', showAll && 'rotate-180')} />
        </button>
      )}
    </>
  );
}

/* ── Collapsible section ─────────────────────────────────────────────── */

export function Disclosure({
  title,
  meta,
  children,
  defaultOpen = false,
}: {
  title: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.015]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-11 w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left"
      >
        <span className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-ash">
          {title}
        </span>
        {meta && <span className="min-w-0 flex-1">{meta}</span>}
        <ChevronDown
          aria-hidden
          className={cn(
            'ml-auto size-4 shrink-0 text-dim transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/8 px-3 py-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Top-three consumers as one 44px-tall bar, so the collapsed disclosure still
 *  shows the shape of the answer. */
export function MiniSpread({ result }: { result: CalcResult }) {
  const top = result.lines.slice(0, 3);
  const total = result.avgLoadW || 1;
  if (!top.length) return null;
  return (
    <span aria-hidden className="flex h-1.5 w-full max-w-24 gap-0.5 overflow-hidden rounded-full">
      {top.map((l, i) => (
        <span
          key={l.appliance.id}
          className={['bg-ember-400', 'bg-ember-500', 'bg-ember-600'][i]}
          style={{ width: `${Math.max(6, (l.avgW / total) * 100)}%` }}
        />
      ))}
      <span className="flex-1 bg-white/10" />
    </span>
  );
}

/* ── Warnings ────────────────────────────────────────────────────────── */

export function Warnings({ result }: { result: CalcResult }) {
  const notes: { tone: 'warn' | 'info'; text: string }[] = [];

  if (result.tooBig.length) {
    notes.push({
      tone: 'warn',
      text: `${result.tooBig.map((a) => a.name).join(', ')} — потужніші за ${inverter.powerW} Вт. Такі прилади цей комплект не потягне: потрібен інвертор більшої потужності.`,
    });
  } else if (result.overContinuous) {
    notes.push({
      tone: 'warn',
      text: `Якщо ввімкнути все одночасно, вийде ${Math.round(result.peakW)} Вт — більше за номінал ${inverter.powerW} Вт, і інвертор піде в захист. По черзі — працюватиме; для одночасної роботи потрібен потужніший інвертор.`,
    });
  } else if (result.overSurge) {
    notes.push({
      tone: 'warn',
      text: `Пусковий струм двигунів дає близько ${Math.round(result.surgeVA)} ВА — на межі піку ${inverter.peakVA} ВА. Запускайте насос і компресор не одночасно.`,
    });
  } else if (result.loadRatio > 0.8) {
    notes.push({
      tone: 'info',
      text: `Навантаження близьке до номіналу. Запас є, але вмикати ще один потужний прилад не варто.`,
    });
  }

  if (!notes.length) return null;

  return (
    <ul className="space-y-2">
      {notes.map((n) => (
        <li
          key={n.text}
          className={cn(
            'flex gap-2.5 rounded-xl border p-3 text-[0.78rem] leading-relaxed',
            n.tone === 'warn'
              ? 'border-alarm-400/30 bg-alarm-500/10 text-alarm-300'
              : 'border-ember-400/25 bg-ember-400/8 text-ember-200',
          )}
        >
          {n.tone === 'warn' ? (
            <AlertTriangle aria-hidden className="mt-px size-4 shrink-0" />
          ) : (
            <Info aria-hidden className="mt-px size-4 shrink-0" />
          )}
          <span>{n.text}</span>
        </li>
      ))}
    </ul>
  );
}

/* ── Quantity stepper used inside a selected tile ────────────────────── */

export function Stepper({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (n: number) => void;
  label: string;
}) {
  return (
    <span className="pointer-events-auto flex items-center gap-1">
      <button
        type="button"
        aria-label={`Менше: ${label}`}
        onClick={() => onChange(Math.max(0, value - 1))}
        // before:-inset-1.5 widens the tap area past 44 px without growing the
        // visual control: at sm the button shrinks to 32 px, which on a tablet
        // would otherwise be under the touch-target minimum.
        className="relative grid size-10 cursor-pointer place-items-center rounded-lg border border-white/12 text-mist transition-colors before:absolute before:-inset-1.5 before:content-[''] hover:border-ember-400/50 hover:text-frost sm:size-8"
      >
        <Minus aria-hidden className="size-3" />
      </button>
      <span className="tnum w-5 text-center text-sm font-bold text-cloud">{value}</span>
      <button
        type="button"
        aria-label={`Більше: ${label}`}
        onClick={() => onChange(Math.min(9, value + 1))}
        className="relative grid size-10 cursor-pointer place-items-center rounded-lg border border-white/12 text-mist transition-colors before:absolute before:-inset-1.5 before:content-[''] hover:border-ember-400/50 hover:text-frost sm:size-8"
      >
        <Plus aria-hidden className="size-3" />
      </button>
    </span>
  );
}

/* ── Empty state ─────────────────────────────────────────────────────── */

export function EmptyResult() {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <span className="grid size-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.03]">
        <BatteryCharging aria-hidden className="size-6 text-ember-400" />
      </span>
      <p className="max-w-[15rem] text-sm leading-relaxed text-mist">
        Оберіть прилади зліва або натисніть готовий сценарій — покажемо, скільки годин вони
        протримаються.
      </p>
    </div>
  );
}

/** Ukrainian plural: 1 прилад / 2 прилади / 5 приладів. */
export function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

/* ── Outage schedule ─────────────────────────────────────────────────────
   The control that turns «скільки годин протримається» into the question the
   product name actually makes: is this uninterruptible power FOR YOUR
   SCHEDULE, or does the bank lose a little every day? */

const scheduleSelect =
  'peer min-h-12 w-full cursor-pointer appearance-none rounded-xl border border-white/12 bg-ink-900 pl-3.5 pr-9 text-[0.95rem] font-semibold text-frost transition-colors hover:border-white/25 focus:border-ember-400/60 focus:outline-none';

function HourSelect({
  label,
  value,
  max,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[0.7rem] font-medium text-ash">{label}</span>
      <span className="relative block">
        <select value={value} onChange={(e) => onChange(Number(e.target.value))} className={scheduleSelect}>
          {Array.from({ length: max + 1 }, (_, h) => (
            <option key={h} value={h}>
              {h} год
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ember-400 transition-colors peer-focus:text-ember-300"
        />
      </span>
    </label>
  );
}

/**
 * A schedule is a repeating CYCLE, which is how it is actually spoken —
 * «чотири через два» — so the two numbers do not have to add up to 24, they
 * only have to fit inside it.
 *
 * The outage length leads: it offers the full 0–24 and trims the other side
 * when it grows. «Є світло» then offers only the hours left in the day, so
 * choosing 20 hours of darkness leaves 0–4 to pick from instead of pretending
 * a 40-hour day exists. Constraining BOTH lists would deadlock the control —
 * you could never reach 20 without first remembering to lower the other one.
 */
export function ScheduleControl({
  off,
  on,
  onChange,
}: {
  off: number;
  on: number;
  onChange: (off: number, on: number) => void;
}) {
  const cycle = off + on;
  const cyclesPerDay = cycle > 0 ? 24 / cycle : 0;
  const dailyOff = off * cyclesPerDay;

  return (
    <div>
      <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ash">
        Графік відключень
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2.5">
        <HourSelect
          label="Немає світла"
          value={off}
          max={24}
          onChange={(v) => onChange(v, Math.min(on, 24 - v))}
        />
        <HourSelect label="Є світло" value={on} max={24 - off} onChange={(v) => onChange(off, v)} />
      </div>
      {cycle > 0 && cycle < 24 && (
        <p className="mt-2 text-[0.7rem] text-dim">
          Цикл повторюється — це {Math.round(dailyOff)} год без світла за добу.
        </p>
      )}
    </div>
  );
}

/** 61.4 → «2 доби 13 год»; under a day it falls back to hours and minutes. */
export function formatSpan(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return '—';
  if (hours < 24) {
    const f = formatHours(hours);
    return `${f.value} ${f.unit}`.trim();
  }
  let days = Math.floor(hours / 24);
  let rest = Math.round(hours - days * 24);
  if (rest === 24) {
    days += 1;
    rest = 0;
  }
  const d = `${days} ${plural(days, 'доба', 'доби', 'діб')}`;
  return rest ? `${d} ${rest} год` : d;
}

/**
 * The arithmetic behind the coverage figure, in one sentence: what an outage
 * takes, what the grid window gives back, and what the difference does to the
 * reserve. Still no verdict — the number above it is the answer.
 */
export function scheduleSummary(s: Sustainability): string {
  const kwh = (wh: number) => (wh / 1000).toFixed(1).replace('.', ',');

  if (s.offHours === 0) {
    return 'Світло є цілодобово — виберіть свій графік, щоб побачити, наскільки вистачить запасу.';
  }
  if (s.usedPerOutageWh <= 0) {
    return 'Додайте прилади, щоб побачити, наскільки вистачить запасу з таким графіком.';
  }

  const drain = `${s.offHours} год без світла забирають ${kwh(s.usedPerOutageWh)} кВт·год`;

  if (s.onHours === 0) {
    return `Мережі в такому графіку немає зовсім, тож банк працює від одного заряду: ${drain}.`;
  }

  const back = `${s.onHours} год мережі повертають ${kwh(s.restoredPerWindowWh)} кВт·год`;

  if (s.coverageHours === null) {
    return `Кожні ${drain}, а ${back}. Заряд відновлюється швидше, ніж витрачається, тож банк тримається в плюсі.`;
  }

  if (s.outagesCovered === 0) {
    return `Одне відключення на ${s.offHours} год забирає ${kwh(s.usedPerOutageWh)} кВт·год — більше, ніж є в банку. Щоб перекрити його цілком, потрібно більше ємності або менше приладів.`;
  }

  const n = s.outagesCovered;
  const outages = plural(n, 'відключення', 'відключення', 'відключень');
  return `Кожні ${drain}, а ${back}. Різниця йде із запасу: повністю банк проходить ${n} ${outages} поспіль, а далі заряду вже не вистачає до кінця.`;
}

/**
 * The headline the schedule controls exist to produce: wall-clock time from a
 * full bank until the house first goes dark, grid windows counted in.
 */
export function ScheduleOutcome({ schedule }: { schedule: Sustainability }) {
  const live = schedule.offHours > 0 && schedule.usedPerOutageWh > 0;

  return (
    <div className="mt-3 border-t border-white/8 pt-2.5">
      {live && (
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-ash">
            З таким графіком вистачить на
          </p>
          <p className="tnum shrink-0 text-[0.95rem] leading-none font-bold text-ember-200">
            {schedule.coverageHours === null
              ? 'Не закінчується'
              : formatSpan(schedule.coverageHours)}
          </p>
        </div>
      )}
      <p className={cn('text-[0.72rem] leading-relaxed text-mist', live && 'mt-1.5')}>
        {scheduleSummary(schedule)}
      </p>
    </div>
  );
}

