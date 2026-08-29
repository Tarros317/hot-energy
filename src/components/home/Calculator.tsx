'use client';

import { memo, useCallback, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Check, ChevronDown, Plus, RotateCcw, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { ApplianceIcon } from '@/components/ui/ApplianceIcon';
import {
  AutonomyDial,
  BatteryPicker,
  Breakdown,
  Disclosure,
  EmptyResult,
  LoadGauge,
  MiniSpread,
  ScheduleControl,
  ScheduleOutcome,
  Stepper,
  Warnings,
  formatSpan,
  plural,
} from '@/components/home/CalculatorResult';
import dynamic from 'next/dynamic';

// The catalogue sheet is real UI only after «Додати прилад» is pressed;
// splitting it keeps its markup, search index and focus-trap code out of the
// synchronous below-the-fold bundle.
const ApplianceCatalog = dynamic(
  () => import('@/components/home/ApplianceCatalog').then((m) => m.ApplianceCatalog),
  { ssr: false },
);
import { openLeadModal } from '@/components/lead/LeadModal';
import { LEAD_FORMS } from '@/lib/lead-forms';
import {
  USAGE_RANGE,
  applianceById,
  usageSummary,
  catalogAppliances,
  coreAppliances,
  formatUsage,
  presets,
  type Appliance,
} from '@/lib/appliances';
import {
  calculate,
  formatHours,
  sustainability,
  type Selection,
} from '@/lib/calc';

/** A preset is a list of ids; each appliance brings its own default hours. */
const fromIds = (ids: readonly string[]): Selection =>
  Object.fromEntries(
    ids
      .map((id) => applianceById.get(id))
      .filter((a): a is Appliance => Boolean(a))
      .map((a) => [a.id, { qty: 1, hours: a.hoursPerDay }]),
  );
import {
  INVERTER_EFFICIENCY,
  USABLE_DOD,
  battery,
  inverter,
  CC_RATE,
  kit,
  usableWh,
} from '@/lib/kit';
import { uah } from '@/lib/site';

/**
 * Autonomy calculator.
 *
 * State is one flat `Selection` map (id → quantity) plus the battery count;
 * everything shown is derived in a single `useMemo`, so there is exactly one
 * place where a number can be wrong.
 *
 * LAYOUT, and why it is shaped this way:
 *
 * · 28 tiles at once read as a wall. Twelve stay on screen — the whole
 *   life-support group plus the three daily objects — and the other sixteen
 *   live in a searchable catalogue, appearing as tiles once added. See
 *   `coreAppliances` in lib/appliances.ts for the reasoning behind the cut.
 *
 * · The results panel is a three-zone flex column (pinned head, scrolling
 *   middle, pinned foot) clamped to the viewport. A sticky element TALLER than
 *   the viewport scrolls away with the page, which is why the old panel never
 *   pinned however correct its `lg:sticky` looked.
 *
 * · The section itself must NOT carry `overflow-hidden`. An ancestor with
 *   hidden overflow becomes the nearest scrollport for a sticky descendant, and
 *   since that ancestor never scrolls, the pin is silently dead. The decorative
 *   layers get their own clipping wrapper instead.
 */
export function Calculator() {
  const reduce = useReducedMotion();
  const [selection, setSelection] = useState<Selection>(() => fromIds(presets[1].items));
  const [batteries, setBatteries] = useState<number>(kit.batteries);
  const [activePreset, setActivePreset] = useState<string | null>(presets[1].id);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [peekOpen, setPeekOpen] = useState(false);
  /** One repeating cycle: hours without mains, then hours with. */
  const [offHours, setOffHours] = useState(8);
  const [onHours, setOnHours] = useState(16);

  const result = useMemo(() => calculate(selection, batteries), [selection, batteries]);
  const schedule = useMemo(
    () => sustainability(result, batteries, offHours, onHours),
    [result, batteries, offHours, onHours],
  );
  const setSchedule = useCallback((off: number, on: number) => {
    setOffHours(off);
    setOnHours(on);
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    setActivePreset(null);
    setSelection((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[id];
      else next[id] = { qty, hours: prev[id]?.hours ?? applianceById.get(id)?.hoursPerDay ?? 1 };
      return next;
    });
  }, []);

  /** Hours are per selected appliance, so they live beside the quantity. */
  const setHours = useCallback((id: string, hours: number) => {
    setActivePreset(null);
    setSelection((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], hours } } : prev));
  }, []);

  // Functional update, no `selection` dependency: with `selection` in the
  // deps this callback got a new identity on every keystroke of every slider,
  // which invalidated the memo() on all 20+ tiles at once.
  const toggle = useCallback(
    (a: Appliance) => {
      setActivePreset(null);
      setSelection((prev) => {
        const next = { ...prev };
        if (prev[a.id]?.qty) delete next[a.id];
        else next[a.id] = { qty: 1, hours: prev[a.id]?.hours ?? a.hoursPerDay };
        return next;
      });
    },
    [],
  );

  const applyPreset = (id: string) => {
    const preset = presets.find((p) => p.id === id);
    if (!preset) return;
    setSelection(fromIds(preset.items));
    setActivePreset(id);
  };

  const reset = () => {
    setSelection({});
    setActivePreset(null);
  };

  /** Non-core appliances currently selected — derived, never stored twice. */
  const added = useMemo(
    () => catalogAppliances.filter((a) => selection[a.id]?.qty),
    [selection],
  );

  /** The selection, rendered as the note that lands in the sales inbox. */
  const noteForLead = () => {
    const list = result.lines
      .map(
        (l) =>
          `• ${l.appliance.name}${l.qty > 1 ? ` ×${l.qty}` : ''} — ${formatUsage(
            l.appliance,
            selection[l.appliance.id]?.hours ?? l.appliance.hoursPerDay,
          )} на добу`,
      )
      .join('\n');
    const { value, unit } = formatHours(result.hours);
    return [
      `Мій розрахунок на сайті:`,
      list,
      ``,
      `Акумуляторів: ${batteries} (${((battery.energyWh * batteries) / 1000).toFixed(2)} кВт·год)`,
      `Автономність: ${value} ${unit}`.trim(),
      `Одночасне навантаження: ${Math.round(result.peakW)} Вт`,
      `Графік: немає ${offHours} год / є ${onHours} год`,
    ].join('\n');
  };

  const sendCalculation = () =>
    openLeadModal({
      config: LEAD_FORMS.calculator,
      source: { id: 'calculator', button: 'Перевірити мій розрахунок' },
      note: noteForLead(),
      meta: {
        'Приладів обрано': String(result.count),
        Акумуляторів: String(batteries),
        Автономність: `${formatHours(result.hours).value} ${formatHours(result.hours).unit}`.trim(),
        'Пікове навантаження': `${Math.round(result.peakW)} Вт`,
      },
    });

  const { value: hoursValue, unit: hoursUnit } = formatHours(result.hours);
  // Worked example for «Як ми рахуємо», derived rather than written down: a
  // trimmed wattage must never leave the prose quoting a number that is gone.
  const routerW = applianceById.get('router')?.watts ?? 12;
  const naiveDays = usableWh(1) / routerW / 24;
  const realDays = usableWh(1) / (routerW / INVERTER_EFFICIENCY + inverter.idleW) / 24;

  const bankKwh = ((battery.energyWh * batteries) / 1000).toFixed(1).replace('.', ',');

  return (
    <section id="kalkulyator" className="relative scroll-mt-24 py-20 sm:py-24 lg:py-28">
      {/* Decoration is clipped HERE, not on the section — see the note above. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="grid-lines absolute inset-0 opacity-35" />
        <div
          className="absolute left-1/2 top-0 h-[30rem] w-[64rem] -translate-x-1/2"
          style={{
            background:
              'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(246,133,14,0.07) 0%, rgba(246,133,14,0.03) 45%, transparent 75%)',
          }}
        />
      </div>

      <Container className="relative">
        <Reveal as="header" className="max-w-3xl">
          <p className="flex items-center gap-3">
            <span className="tnum text-xs text-ember-600">02</span>
            <span aria-hidden className="h-px w-8 bg-ember-500/50" />
            <span className="eyebrow">Калькулятор автономності</span>
          </p>
          <h2 className="font-heading mt-5 text-[clamp(1.75rem,4.6vw,3rem)] leading-[1.08] text-cloud">
            Скільки протримається <span className="text-ember-sheen">саме ваш дім</span>
          </h2>
          <p className="mt-5 text-[1.02rem] leading-relaxed text-mist sm:text-lg">
            Позначте, що має працювати, коли світло зникне, і скільки годин на добу воно
            працює. Мікрохвильовку ми рахуємо як мікрохвильовку — десять хвилин на добу, а не
            «цілий день». Тому цифра внизу схожа на правду.
          </p>
        </Reveal>

        {/* Presets */}
        <Reveal className="mt-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 hidden font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ash sm:inline">
              Швидкий старт:
            </span>
            {presets.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p.id)}
                aria-pressed={activePreset === p.id}
                title={p.caption}
                className={cn(
                  'inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-[0.8rem] font-medium transition-colors',
                  activePreset === p.id
                    ? 'border-ember-400/60 bg-ember-400/12 text-ember-100'
                    : 'border-white/10 bg-white/[0.02] text-mist hover:border-white/25 hover:text-frost',
                )}
              >
                {activePreset === p.id && (
                  <Check aria-hidden className="mr-1.5 inline size-3.5 align-[-2px]" />
                )}
                {p.label}
              </button>
            ))}
            <button
              type="button"
              onClick={reset}
              className="ml-auto inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[0.78rem] text-dim transition-colors hover:text-frost"
            >
              <RotateCcw aria-hidden className="size-3.5" />
              Очистити
            </button>
          </div>
        </Reveal>

        {/* Mobile peek — the live number stays on screen while the visitor taps
            through the tiles, and expands into the controls worth reaching for
            without scrolling to the panel. */}
        <MobilePeek
          open={peekOpen}
          onToggle={() => setPeekOpen((v) => !v)}
          result={result}
          batteries={batteries}
          onBatteries={setBatteries}
          hoursValue={hoursValue}
          hoursUnit={hoursUnit}
          onSend={sendCalculation}
          schedule={schedule}
          offHours={offHours}
          onHours={onHours}
          onSchedule={setSchedule}
        />

        <div className="mt-6 grid gap-8 lg:mt-10 lg:grid-cols-[1.25fr_1fr] lg:items-start lg:gap-10">
          {/* ── Picker ────────────────────────────────────────────────── */}
          <div>
            <Reveal>
              <div className="flex items-baseline justify-between gap-4 border-b border-white/8 pb-2.5">
                <h3 className="font-heading text-base text-cloud">Основне</h3>
                <p className="text-[0.72rem] text-dim">Те, що вмикають майже всі</p>
              </div>
              <ul className="mt-4 grid grid-cols-1 items-start gap-2 sm:grid-cols-2 sm:gap-2.5">
                {coreAppliances.map((a) => (
                  <Tile
                    key={a.id}
                    appliance={a}
                    qty={selection[a.id]?.qty ?? 0}
                    hours={selection[a.id]?.hours ?? a.hoursPerDay}
                    onToggle={toggle}
                    onQty={setQty}
                    onHours={setHours}
                  />
                ))}
              </ul>
              <p className="mt-3 text-[0.72rem] leading-relaxed text-dim">
                Життєзабезпечення рахуємо як таке, що працює весь час; кухонні прилади — короткими
                вмиканнями по кілька хвилин.
              </p>
            </Reveal>

            {/* ── Added from the catalogue ───────────────────────────── */}
            <Reveal className="mt-8">
              <div className="flex items-baseline justify-between gap-4 border-b border-white/8 pb-2.5">
                <h3 className="font-heading text-base text-cloud">
                  Додатково
                  {added.length > 0 && (
                    <span className="tnum ml-2 rounded-full border border-ember-400/40 bg-ember-400/10 px-2 py-0.5 text-[0.7rem] font-semibold text-ember-200">
                      {added.length}
                    </span>
                  )}
                </h3>
                <p className="text-[0.72rem] text-dim">Що додали ви</p>
              </div>

              <AnimatePresence initial={false}>
                {added.length > 0 && (
                  <motion.ul
                    key="added"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={reduce ? { duration: 0 } : { duration: 0.24 }}
                    className="grid grid-cols-1 items-start gap-2 overflow-hidden sm:grid-cols-2 sm:gap-2.5"
                    style={{ marginTop: added.length ? '1rem' : 0 }}
                  >
                    {added.map((a) => (
                      <Tile
                        key={a.id}
                        appliance={a}
                        qty={selection[a.id]?.qty ?? 0}
                        hours={selection[a.id]?.hours ?? a.hoursPerDay}
                        onToggle={toggle}
                        onQty={setQty}
                        onHours={setHours}
                        removable
                      />
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>

              <button
                type="button"
                onClick={() => setCatalogOpen(true)}
                className="mt-4 flex min-h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 px-4 text-[0.9rem] font-semibold text-ember-300 transition-colors hover:border-ember-400/50 hover:bg-ember-400/5"
              >
                <Plus aria-hidden className="size-4" />
                Додати прилад
              </button>
              {added.length === 0 && (
                <p className="mt-2 text-center text-[0.72rem] text-dim">
                  Ще {catalogAppliances.length}{' '}
                  {plural(catalogAppliances.length, 'прилад', 'прилади', 'приладів')}: кухня, побут,
                  клімат
                </p>
              )}
            </Reveal>
          </div>

          {/* ── Results ───────────────────────────────────────────────── */}
          <Reveal className="lg:sticky lg:top-28 lg:max-h-[calc(100svh-8rem)]">
            <div className="panel relative flex min-h-0 flex-col overflow-hidden rounded-3xl lg:max-h-[calc(100svh-8rem)]">
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-ember-400/60 to-transparent"
              />

              {result.count === 0 ? (
                <div className="p-5 sm:p-6">
                  <EmptyResult />
                </div>
              ) : (
                <>
                  {/* HEAD — pinned */}
                  <div className="shrink-0 px-5 pb-4 pt-5 sm:px-6">
                    <div className="flex items-center gap-4">
                      <div className="w-[8.5rem] shrink-0 sm:w-[9.5rem]">
                        <AutonomyDial
                          compact
                          hours={result.hours}
                          over={result.overContinuous}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-ash">
                          Автономність
                        </p>
                        <p className="mt-1 flex flex-wrap items-baseline gap-x-1">
                          <span className="tnum text-[1.5rem] font-bold leading-none text-cloud">
                            {hoursValue}
                          </span>
                          {hoursUnit && (
                            <span className="text-sm font-semibold text-ember-400">
                              {hoursUnit}
                            </span>
                          )}
                        </p>
                        {/* The inverter's own draw is named here rather than
                            folded into an average: on a small load it IS the
                            load, and hiding it makes the hours look wrong. */}
                        <p className="mt-2 text-[0.72rem] leading-snug text-ash">
                          {Math.round(result.avgLoadW)} Вт прилади + {inverter.idleW} Вт інвертор ·{' '}
                          {bankKwh} кВт·год запас
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* BODY — the only part allowed to scroll.
                      min-h-0 is load-bearing: without it this flex child
                      refuses to shrink below its content and nothing scrolls. */}
                  <div
                    data-lenis-prevent
                    className="space-y-3.5 border-t border-white/8 px-5 py-4 sm:px-6 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain"
                  >
                    <LoadGauge result={result} />
                    <Warnings result={result} />
                    <BatteryPicker value={batteries} onChange={setBatteries} compact />

                    <div className="rounded-xl border border-white/8 bg-white/[0.015] p-3">
                      <ScheduleControl off={offHours} on={onHours} onChange={setSchedule} />
                      <ScheduleOutcome schedule={schedule} />
                    </div>

                    <Disclosure
                      title="Куди йде енергія"
                      meta={<MiniSpread result={result} />}
                    >
                      <Breakdown result={result} onRemove={(id) => setQty(id, 0)} />
                    </Disclosure>

                    <Disclosure title="Як ми рахуємо">
                      <div className="space-y-2 text-[0.75rem] leading-relaxed text-mist">
                        <p>
                          Автономність оцінна: враховано ККД інвертора{' '}
                          {Math.round(INVERTER_EFFICIENCY * 100)} %, власне споживання інвертора{' '}
                          {inverter.idleW} Вт і глибину розряду {Math.round(USABLE_DOD * 100)} %.
                        </p>
                        <p>
                          Ці {inverter.idleW} Вт — головна причина, чому мале навантаження не дає
                          тисячі годин. Роутер на {routerW} Вт сам по собі розтягнув би банк на{' '}
                          {naiveDays.toFixed(0)} діб, але інвертор поруч витрачає вдвічі більше за
                          нього — тож виходить близько{' '}
                          {realDays.toFixed(1).replace('.', ',')} доби. Що більше приладів, то
                          менше важить ця надбавка.
                        </p>
                        <p>
                          Кожен прилад рахуємо за той час, який ви йому поставили: середнє
                          споживання — це потужність, помножена на години роботи й поділена на
                          добу. Ми припускаємо, що прилад працює рівномірно протягом дня.
                        </p>
                        <p>
                          Графік «{offHours} через {onHours}» не зводимо до балансу за добу —
                          проходимо його кроками від повного банку: відключення розряджає,
                          вікно з мережею підзаряджає, і так по колу, доки заряду вистачає.
                          Тому цифра «вистачить на» враховує ще й початковий запас, а не лише
                          різницю між витратою й підзарядкою — і тому кожен наступний
                          акумулятор її подовжує.
                        </p>
                        <p>
                          Заряд повертається зі струмом до {inverter.acChargerA} А — приблизно{' '}
                          {(CC_RATE / 1000).toFixed(2).replace('.', ',')} кВт·год за кожну годину
                          мережі, тож повний банк із нуля набирається за{' '}
                          {formatSpan(schedule.fullRechargeHours)}. Струм спадає лише в останніх
                          15 % ємності, тож коротке підзаряджання після відключення йде на повній
                          швидкості.
                        </p>
                        <p>
                          У переліку немає приладів, потужніших за {inverter.powerW} Вт — чайника,
                          праски, фена, бойлера, пральної та посудомийної машин. Цей інвертор їх не
                          потягне, тож ми не пропонуємо їх обирати. Якщо вони потрібні, підберемо
                          комплект з потужнішим інвертором.
                        </p>
                        <p>
                          Один модуль — 4 кВт·год. Можна докупити пізніше: до {kit.maxBatteries}{' '}
                          штук паралельно без заміни інвертора.
                        </p>
                        {batteries > 1 && (
                          <p className="text-dim">
                            Ціну додаткових акумуляторів підтвердимо при замовленні — вона залежить
                            від курсу й наявності на складі.
                          </p>
                        )}
                      </div>
                    </Disclosure>
                  </div>
                </>
              )}

              {/* FOOT — pinned */}
              <div className="shrink-0 space-y-2.5 border-t border-white/8 px-5 py-4 sm:px-6">
                <p className="flex items-baseline justify-between gap-3">
                  <span className="text-sm text-mist">
                    Комплект{' '}
                    {batteries > 1 && `+ ${batteries - 1} АКБ`}
                  </span>
                  <span className="tnum text-lg font-bold text-cloud">
                    {batteries > 1 && <span className="text-ash">≈ </span>}
                    {uah(kit.priceUah + (batteries - 1) * kit.extraBatteryUah)} ₴
                  </span>
                </p>
                <button
                  type="button"
                  onClick={sendCalculation}
                  className="group inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-ember-300 to-ember-500 px-6 font-bold text-abyss shadow-[0_10px_32px_-12px_rgba(246,133,14,0.85)] transition-transform hover:-translate-y-0.5"
                >
                  Перевірити мій розрахунок
                  <ArrowRight
                    aria-hidden
                    className="size-4 transition-transform group-hover:translate-x-1"
                  />
                </button>
              </div>
            </div>
          </Reveal>
        </div>
      </Container>

      <ApplianceCatalog
        open={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        selection={selection}
        onToggle={toggle}
      />
    </section>
  );
}

/* ── Mobile peek ─────────────────────────────────────────────────────── */

function MobilePeek({
  open,
  onToggle,
  result,
  batteries,
  onBatteries,
  hoursValue,
  hoursUnit,
  onSend,
  schedule,
  offHours,
  onHours,
  onSchedule,
}: {
  open: boolean;
  onToggle: () => void;
  result: ReturnType<typeof calculate>;
  batteries: number;
  onBatteries: (n: number) => void;
  hoursValue: string;
  hoursUnit: string;
  onSend: () => void;
  schedule: ReturnType<typeof sustainability>;
  offHours: number;
  onHours: number;
  onSchedule: (off: number, on: number) => void;
}) {
  const reduce = useReducedMotion();

  return (
    // The offset is a token, not a magic number: on a notched phone the header
    // capsule ends well below the 5.25rem the old hard-coded value assumed.
    <div
      className="sticky z-40 -mx-5 mt-6 px-5 lg:hidden"
      style={{ top: 'calc(var(--header-h) + env(safe-area-inset-top, 0px) + 0.5rem)' }}
    >
      <div className="panel overflow-hidden rounded-2xl">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex min-h-13 w-full cursor-pointer items-center gap-3 px-3.5 py-2.5 text-left"
        >
          <span
            className={cn(
              'size-2 shrink-0 rounded-full',
              result.overContinuous ? 'bg-alarm-400' : 'bg-volt-400',
            )}
          />
          <span className="min-w-0 flex-1">
            <span className="tnum text-lg font-bold text-cloud">{hoursValue}</span>{' '}
            <span className="text-xs font-semibold text-ember-400">{hoursUnit}</span>
            <span className="mt-0.5 block text-[0.7rem] text-ash">
              {result.count} {plural(result.count, 'прилад', 'прилади', 'приладів')} ·{' '}
              {batteries} АКБ · графік {offHours}/{onHours}
              {result.overContinuous && ' · перевантаження'}
            </span>
          </span>
          <span className="tnum shrink-0 rounded-lg border border-white/10 px-2 py-1 text-[0.7rem] text-mist">
            {Math.round(result.peakW)} Вт
          </span>
          <ChevronDown
            aria-hidden
            className={cn('size-4 shrink-0 text-dim transition-transform', open && 'rotate-180')}
          />
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={reduce ? { duration: 0 } : { duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="space-y-3.5 border-t border-white/8 px-3.5 py-3.5">
                <LoadGauge result={result} compact />
                <Warnings result={result} />
                <BatteryPicker value={batteries} onChange={onBatteries} compact />
                <div className="rounded-xl border border-white/8 bg-white/[0.015] p-3">
                  <ScheduleControl off={offHours} on={onHours} onChange={onSchedule} />
                  <ScheduleOutcome schedule={schedule} />
                </div>
                <button
                  type="button"
                  onClick={onSend}
                  className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-ember-300 to-ember-500 px-5 font-bold text-abyss"
                >
                  Перевірити мій розрахунок
                  <ArrowRight aria-hidden className="size-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Appliance tile ──────────────────────────────────────────────────── */

const Tile = memo(function Tile({
  appliance,
  qty,
  hours,
  onToggle,
  onQty,
  onHours,
  removable = false,
}: {
  appliance: Appliance;
  qty: number;
  hours: number;
  onToggle: (a: Appliance) => void;
  onQty: (id: string, n: number) => void;
  onHours: (id: string, hours: number) => void;
  /** Catalogue additions show an × instead of a tick — tapping them removes. */
  removable?: boolean;
}) {
  const selected = qty > 0;
  const heavy = (appliance.peakW ?? appliance.watts) > inverter.powerW;
  const adjustable = appliance.unit !== 'fixed';
  const range = appliance.unit === 'fixed' ? null : USAGE_RANGE[appliance.unit];
  const sliderValue = appliance.unit === 'min' ? Math.round(hours * 60) : Math.round(hours);

  return (
    <li>
      {/* A row, not a portrait tile. A portrait tile has to fit the longest
          word, a stepper AND a slider inside one column; below ~340 px that
          stops being possible and the controls spill past the border. A row
          spends the width it has on the name and puts the controls on their
          own line, so one column reads like a list on a phone and two columns
          still fit on a desktop. */}
      <div
        className={cn(
          'group relative rounded-2xl border transition-colors',
          selected
            ? 'border-ember-400/55 bg-ember-400/8'
            : 'border-white/8 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]',
        )}
      >
        {/* The whole row toggles, but the stepper must stay its own control —
            so the toggle is a stretched button UNDER the content rather than a
            <button> wrapping more buttons (invalid HTML). */}
        <button
          type="button"
          onClick={() => onToggle(appliance)}
          aria-pressed={selected}
          className="absolute inset-0 z-0 cursor-pointer rounded-2xl"
        >
          <span className="sr-only">
            {selected ? `Прибрати: ${appliance.name}` : `Додати: ${appliance.name}`}
          </span>
        </button>

        <div className="pointer-events-none relative z-10 p-2.5 sm:p-3">
          <div className="flex min-h-11 items-center gap-2.5">
            <span
              className={cn(
                'grid size-9 shrink-0 place-items-center rounded-lg border transition-colors',
                selected
                  ? 'border-ember-400/40 bg-ember-400/15 text-ember-300'
                  : 'border-white/8 bg-white/[0.03] text-mist group-hover:text-frost',
              )}
            >
              <ApplianceIcon id={appliance.id} className="size-4.5" />
            </span>

            {/* min-w-0 lets the flex child shrink below its text width, which
                is what makes truncate work at all inside a flex row. */}
            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  'line-clamp-2 text-[0.9rem] leading-tight font-semibold',
                  selected ? 'text-cloud' : 'text-frost',
                )}
              >
                {appliance.name}
              </span>
              {/* Always visible: it is what tells you whether to tick the box,
                  so hiding it until after the tick is backwards. Clipped to one
                  line while scanning, opened to two once the row is chosen and
                  has the height to spare anyway. */}
              <span
                className={cn(
                  'mt-0.5 text-[0.72rem] leading-snug text-ash',
                  selected ? 'line-clamp-2' : 'line-clamp-1',
                )}
              >
                {appliance.note}
              </span>
            </span>

            <span className="flex shrink-0 items-center gap-1.5">
              {heavy && (
                <span className="rounded-md border border-alarm-400/35 bg-alarm-500/10 px-1.5 py-0.5 text-[0.62rem] font-semibold text-alarm-300">
                  &gt; {inverter.powerW} Вт
                </span>
              )}
              <span className="tnum text-[0.72rem] text-dim">
                {appliance.peakW ?? appliance.watts} Вт
              </span>
              <span
                className={cn(
                  'grid size-5 place-items-center rounded-full border transition-colors',
                  selected
                    ? removable
                      ? 'border-white/25 text-mist'
                      : 'border-ember-400 bg-ember-400 text-abyss'
                    : 'border-white/18 text-transparent group-hover:border-white/35',
                )}
              >
                {removable && selected ? (
                  <X aria-hidden className="size-3" strokeWidth={3} />
                ) : (
                  <Check aria-hidden className="size-3" strokeWidth={3} />
                )}
              </span>
            </span>
          </div>

          <AnimatePresence initial={false}>
            {selected && (
              <motion.div
                key="controls"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {/* flex-wrap does the responsive work by itself: when the
                    column is too narrow to hold the stepper and the slider
                    side by side, the slider drops to its own line instead of
                    being squeezed to nothing. */}
                <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-white/8 pt-2.5">
                  <Stepper
                    value={qty}
                    onChange={(n) => onQty(appliance.id, n)}
                    label={appliance.name}
                  />

                  {/* Usage time is the knob that moves the answer, so it sits
                      on the row. Appliances whose duty cycle is physics — a
                      fridge, a router — state their average instead: a slider
                      there would only invite the wrong answer. */}
                  {adjustable && range ? (
                    <span className="pointer-events-auto flex min-w-36 flex-1 items-center gap-2.5">
                      <input
                        type="range"
                        min={range.min}
                        max={range.max}
                        step={range.step}
                        value={sliderValue}
                        onChange={(e) =>
                          onHours(
                            appliance.id,
                            appliance.unit === 'min'
                              ? Number(e.target.value) / 60
                              : Number(e.target.value),
                          )
                        }
                        aria-label={`Скільки працює на добу: ${appliance.name}`}
                        aria-valuetext={formatUsage(appliance, hours)}
                        className="h-10 min-w-0 flex-1 sm:h-7"
                      />
                      <span className="tnum w-14 shrink-0 text-right text-[0.75rem] font-semibold text-ember-200">
                        {formatUsage(appliance, hours)}
                      </span>
                    </span>
                  ) : (
                    <span className="min-w-0 flex-1 text-right text-[0.7rem] leading-snug text-ash">
                      {usageSummary(appliance)}
                    </span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </li>
  );
});
