'use client';

import Image from 'next/image';
import { Check, Minus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { inverter } from '@/lib/kit';
import { media } from '@/lib/media';

/**
 * Honest three-way comparison. The generator column is not a strawman: it
 * genuinely wins on total power and refuel-forever runtime, and saying so is
 * what makes the rest of the table believable.
 */

type Verdict = 'yes' | 'no' | 'partly';

const COLUMNS: {
  id: string;
  label: string;
  /** Stacked-card heading: the full label is longer than the answer under it. */
  short: string;
  sub: string;
  accent?: boolean;
}[] = [
  { id: 'kit', label: 'Цей комплект', short: 'Цей комплект', sub: 'інвертор + LiFePO₄', accent: true },
  { id: 'gen', label: 'Бензиновий генератор', short: 'Генератор', sub: '2–3 кВт' },
  { id: 'bank', label: 'Портативна зарядна станція', short: 'Зарядна станція', sub: '1–1,5 кВт·год' },
];

const ROWS: {
  criterion: string;
  cells: { verdict: Verdict; text: string }[];
}[] = [
  {
    criterion: 'Що робить, коли світло зникло',
    cells: [
      { verdict: 'yes', text: `Перемикається сам за ${inverter.transferMsPc} мс` },
      { verdict: 'no', text: 'Треба вийти, завести, перекинути кабелі' },
      { verdict: 'partly', text: 'Тримає те, що в нього ввімкнено' },
    ],
  },
  {
    criterion: 'Шум і вихлоп',
    cells: [
      { verdict: 'yes', text: 'Тиша, працює в кімнаті' },
      { verdict: 'no', text: '70–90 дБ, тільки надвір' },
      { verdict: 'yes', text: 'Тиша' },
    ],
  },
  {
    criterion: 'Живлення газового котла',
    cells: [
      { verdict: 'yes', text: 'Чиста синусоїда, автоматика не вередує' },
      { verdict: 'partly', text: 'Потрібен інверторний генератор і заземлення' },
      { verdict: 'partly', text: 'Так, але ненадовго' },
    ],
  },
  {
    criterion: 'Скільки триває запас',
    cells: [
      { verdict: 'partly', text: '4–14 год залежно від приладів і кількості АКБ' },
      { verdict: 'yes', text: 'Поки є пальне' },
      { verdict: 'no', text: '1–3 год на базовому наборі' },
    ],
  },
  {
    criterion: 'Що коштує щомісяця',
    cells: [
      { verdict: 'yes', text: 'Тільки електрика на заряд' },
      { verdict: 'no', text: 'Бензин, олива, ТО, свічки' },
      { verdict: 'yes', text: 'Тільки електрика на заряд' },
    ],
  },
  {
    criterion: 'Обслуговування',
    cells: [
      { verdict: 'yes', text: 'Немає' },
      { verdict: 'no', text: 'Регулярне, плюс запуск раз на місяць' },
      { verdict: 'yes', text: 'Немає' },
    ],
  },
  {
    criterion: 'Розширення',
    cells: [
      { verdict: 'yes', text: 'До 4 акумуляторів і сонячні панелі' },
      { verdict: 'no', text: 'Тільки купити більший' },
      { verdict: 'partly', text: 'Іноді додаткова батарея' },
    ],
  },
  {
    criterion: 'Ресурс',
    cells: [
      { verdict: 'yes', text: '6 000 циклів — понад 10 років' },
      { verdict: 'partly', text: '500–1 500 мотогодин' },
      { verdict: 'partly', text: '500–3 000 циклів' },
    ],
  },
];

const ICON: Record<Verdict, typeof Check> = { yes: Check, no: X, partly: Minus };
const TONE: Record<Verdict, string> = {
  yes: 'text-volt-400',
  no: 'text-alarm-400',
  partly: 'text-ash',
};

export function Compare() {
  return (
    <section className="relative overflow-hidden border-y border-white/8 bg-ink-950 py-20 sm:py-24 lg:py-28">
      {/* Texture: a desk still lit at night — the state this table is about. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <Image
          src={media.desk}
          alt=""
          fill
          quality={60}
          sizes="100vw"
          className="object-cover opacity-[0.08]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950 via-ink-950/85 to-ink-950" />
      </div>
      <div aria-hidden className="grid-lines pointer-events-none absolute inset-0 opacity-35" />

      <Container className="relative">
        <Reveal as="header" className="max-w-3xl">
          <p className="flex items-center gap-3">
            <span className="tnum text-xs text-ember-600">07</span>
            <span aria-hidden className="h-px w-8 bg-ember-500/50" />
            <span className="eyebrow">Порівняння</span>
          </p>
          <h2 className="font-heading mt-5 text-[clamp(1.75rem,4.6vw,3rem)] leading-[1.08] text-cloud">
            Генератор, павербанк чи{' '}
            <span className="text-ember-sheen">стаціонарний комплект</span>
          </h2>
          <p className="mt-5 text-[1.02rem] leading-relaxed text-mist sm:text-lg">
            У генератора є своя перевага, і ми її не приховуємо: поки є пальне, він тягне більше й
            довше. Але за все інше доводиться платити щоразу, коли гасне світло.
          </p>
        </Reveal>

        <Reveal className="mt-10">
          {/* Phones get one card per criterion instead of the table.
              Three columns of prose need ~700 px before the cells stop
              truncating, and a table that scrolls sideways hides exactly the
              half of the comparison that makes the argument — you cannot weigh
              a generator against the kit if only one of them is on screen. */}
          <div className="space-y-2.5 md:hidden">
            {ROWS.map((row) => (
              <div key={row.criterion} className="panel overflow-hidden rounded-2xl">
                <p className="border-b border-white/8 bg-white/[0.03] px-4 py-2.5 font-mono text-[0.62rem] tracking-[0.16em] text-ash uppercase">
                  {row.criterion}
                </p>
                <ul className="divide-y divide-white/6">
                  {row.cells.map((cell, i) => {
                    const Icon = ICON[cell.verdict];
                    const col = COLUMNS[i];
                    return (
                      <li
                        key={col.id}
                        className={cn('flex gap-2.5 px-4 py-2.5', col.accent && 'bg-ember-400/6')}
                      >
                        <Icon
                          aria-hidden
                          className={cn('mt-0.5 size-4 shrink-0', TONE[cell.verdict])}
                        />
                        <span className="min-w-0 flex-1">
                          <span
                            className={cn(
                              'block text-[0.72rem] font-semibold',
                              col.accent ? 'text-ember-200' : 'text-dim',
                            )}
                          >
                            {col.short}
                          </span>
                          <span className="mt-0.5 block text-[0.83rem] leading-snug text-mist">
                            {cell.text}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          {/* From md up the table fits inside the container without scrolling;
              overflow-x-auto stays as a safety net for enlarged text. */}
          <div className="panel hidden overflow-x-auto rounded-3xl md:block">
            <table className="w-full min-w-[43rem] border-collapse text-left">
              <caption className="sr-only">
                Порівняння комплекту безперебійного живлення, генератора та портативної зарядної
                станції
              </caption>
              <thead>
                <tr>
                  <th scope="col" className="sticky left-0 z-10 bg-ink-900 px-5 py-4 sm:px-6" />
                  {COLUMNS.map((c) => (
                    <th
                      key={c.id}
                      scope="col"
                      className={cn(
                        'px-4 py-4 align-bottom sm:px-5',
                        c.accent && 'bg-ember-400/6',
                      )}
                    >
                      <span
                        className={cn(
                          'font-heading block text-[0.95rem] leading-tight',
                          c.accent ? 'text-ember-200' : 'text-frost',
                        )}
                      >
                        {c.label}
                      </span>
                      <span className="mt-1 block text-[0.72rem] text-dim">{c.sub}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.criterion} className="border-t border-white/7">
                    <th
                      scope="row"
                      className="sticky left-0 z-10 bg-ink-900 px-5 py-4 align-top text-[0.82rem] font-medium text-ash sm:px-6"
                    >
                      {row.criterion}
                    </th>
                    {row.cells.map((cell, i) => {
                      const Icon = ICON[cell.verdict];
                      return (
                        <td
                          key={i}
                          className={cn(
                            'px-4 py-4 align-top sm:px-5',
                            COLUMNS[i].accent && 'bg-ember-400/6',
                          )}
                        >
                          <span className="flex gap-2">
                            <Icon
                              aria-hidden
                              className={cn('mt-0.5 size-4 shrink-0', TONE[cell.verdict])}
                            />
                            <span className="text-[0.83rem] leading-relaxed text-mist">
                              {cell.text}
                            </span>
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
