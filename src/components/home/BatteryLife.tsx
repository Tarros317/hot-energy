'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { battery } from '@/lib/kit';
import { plural } from '@/components/home/CalculatorResult';

/**
 * Service-life slider.
 *
 * Cycle counts mean nothing to a household — «6 000 циклів» is a number on a
 * box. Divided by how often the bank is actually emptied it turns into years,
 * and the lead–acid comparison stops being a claim and becomes arithmetic.
 */

/** Typical deep-cycle AGM rating at the same 80 % depth of discharge. */
const AGM_CYCLES = 500;
const MAX_PER_WEEK = 14;

/**
 * Cycles are only half the story: a cell also ages on the calendar, whether it
 * is cycled or not. Below roughly two discharges a week the cycle count stops
 * being the limit, so the answer is capped at realistic service life instead of
 * printing an obviously silly «115 років».
 */
const CALENDAR_LIMIT = { li: 15, agm: 6 } as const;

export function BatteryLife() {
  const reduce = useReducedMotion();
  const [perWeek, setPerWeek] = useState(5);

  const years = (n: number, cycles: number) => cycles / (n * 52);
  const liRaw = years(perWeek, battery.cycles);
  const agmRaw = years(perWeek, AGM_CYCLES);
  const li = Math.min(liRaw, CALENDAR_LIMIT.li);
  const agm = Math.min(agmRaw, CALENDAR_LIMIT.agm);
  const liCapped = liRaw > CALENDAR_LIMIT.li;
  const agmCapped = agmRaw > CALENDAR_LIMIT.agm;

  /** «2 роки» reads better than «2,0 років»; under two years, switch to months. */
  const fmt = (y: number): { value: string; unit: string } => {
    if (y < 2) {
      const m = Math.max(1, Math.round(y * 12));
      return { value: String(m), unit: plural(m, 'місяць', 'місяці', 'місяців') };
    }
    if (y >= 10) {
      const n = Math.round(y);
      return { value: String(n), unit: plural(n, 'рік', 'роки', 'років') };
    }
    const rounded = Math.round(y * 10) / 10;
    const whole = Number.isInteger(rounded);
    return {
      value: whole ? String(rounded) : rounded.toFixed(1).replace('.', ','),
      unit: whole ? plural(rounded, 'рік', 'роки', 'років') : 'року',
    };
  };

  // Both bars are scaled against the lithium figure.
  const scale = li;

  return (
    <div className="panel rounded-3xl p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ash">
          Скільки прослужить
        </p>
        <p className="text-[0.78rem] text-mist">
          Повних розрядів на тиждень:{' '}
          <span className="tnum font-bold text-frost">{perWeek}</span>
        </p>
      </div>

      <label className="mt-4 block">
        <span className="sr-only">Кількість повних розрядів на тиждень</span>
        <input
          type="range"
          min={1}
          max={MAX_PER_WEEK}
          step={1}
          value={perWeek}
          onChange={(e) => setPerWeek(Number(e.target.value))}
          className="h-10 w-full"
          aria-valuetext={`${perWeek} ${plural(perWeek, 'розряд', 'розряди', 'розрядів')} на тиждень`}
        />
      </label>
      <div className="mt-1 flex justify-between font-mono text-[0.6rem] text-dim">
        <span>рідко</span>
        <span>щодня</span>
        <span>двічі на день</span>
      </div>

      <div className="mt-6 space-y-4">
        <Row
          label={`LiFePO₄ ${battery.brand}`}
          sub={`${battery.cycles.toLocaleString('uk-UA')} циклів`}
          life={fmt(li)}
          capped={liCapped}
          width={100}
          accent
          reduce={reduce}
        />
        <Row
          label="Звичайний AGM-акумулятор"
          sub={`≈ ${AGM_CYCLES} циклів`}
          life={fmt(agm)}
          capped={agmCapped}
          width={Math.max(4, (agm / scale) * 100)}
          reduce={reduce}
        />
      </div>

      <p className="mt-5 border-t border-white/8 pt-4 text-[0.75rem] leading-relaxed text-dim">
        Розрахунок за глибиною розряду {battery.cycleDod} %.{' '}
        {liCapped
          ? `При такому режимі циклів вистачить надовше — але акумулятор старіє й просто від часу, тому показуємо реальний строк служби, а не арифметику.`
          : `Реальний ресурс залежить від температури й режиму заряду — але порядок цифр саме такий, і саме тому свинець у щоденних відключеннях виходить дорожчим.`}{' '}
        Гарантія виробника — {battery.warrantyMonths} місяців.
      </p>
    </div>
  );
}

function Row({
  label,
  sub,
  life,
  capped,
  width,
  accent,
  reduce,
}: {
  label: string;
  sub: string;
  life: { value: string; unit: string };
  /** True when calendar ageing, not the cycle count, is the binding limit. */
  capped?: boolean;
  width: number;
  accent?: boolean;
  reduce: boolean | null;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[0.85rem] font-semibold text-frost">
          {label} <span className="font-normal text-dim">· {sub}</span>
        </p>
        <p className="shrink-0">
          <span className="tnum text-lg font-bold text-cloud">
            {life.value}
            {capped && '+'}
          </span>
          <span className="ml-1 text-[0.7rem] text-ember-400">{life.unit}</span>
        </p>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/7">
        <motion.div
          className={
            accent
              ? 'h-full rounded-full bg-gradient-to-r from-ember-500 to-ember-300'
              : 'h-full rounded-full bg-white/20'
          }
          initial={false}
          animate={{ width: `${Math.min(100, width)}%` }}
          transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 22 }}
        />
      </div>
    </div>
  );
}
