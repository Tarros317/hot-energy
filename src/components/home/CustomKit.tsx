'use client';

import { useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Check, Loader2, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { useLeadSubmit } from '@/lib/use-lead-submit';
import { media } from '@/lib/media';
import { site } from '@/lib/site';

/**
 * «Зберемо під ваші задачі» — the inline configurator form.
 *
 * Two taps describe the whole brief (how much power, how many hours), so the
 * visitor who does not want to work through the calculator still sends
 * something the sales desk can quote from. The chips are part of the payload,
 * not decoration.
 */

const POWER = [
  { id: '1.5', label: 'до 1,5 кВт', hint: 'світло, техніка, котел' },
  { id: '3', label: '3 кВт', hint: '+ чайник, мікрохвильовка' },
  { id: '5', label: '5 кВт', hint: '+ бойлер, насос, плита' },
  { id: '8', label: '8 кВт і більше', hint: 'будинок цілком' },
];

const CAPACITY = [
  { id: '4', label: '4 кВт·год', hint: 'одне відключення' },
  { id: '8', label: '8 кВт·год', hint: 'вечір і ніч' },
  { id: '12', label: '12 кВт·год', hint: 'повна доба' },
  { id: '16', label: '16 кВт·год +', hint: 'кілька діб' },
];

const fieldClass =
  'w-full rounded-xl border border-white/12 bg-ink-900 px-4 py-3 text-[0.95rem] text-frost transition-colors placeholder:text-dim focus:border-ember-400/60 focus:outline-none';

export function CustomKit() {
  const { status, error, submit } = useLeadSubmit();
  const [power, setPower] = useState<string | null>(null);
  const [capacity, setCapacity] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === 'submitting') return;
    const fd = new FormData(e.currentTarget);
    const fields: Record<string, string> = {};
    if (power) fields['Потрібна потужність'] = POWER.find((p) => p.id === power)?.label ?? power;
    if (capacity)
      fields['Потрібна ємність'] = CAPACITY.find((c) => c.id === capacity)?.label ?? capacity;

    await submit(
      {
        name: String(fd.get('name') ?? '').trim(),
        phone: String(fd.get('phone') ?? '').trim(),
        context: 'Індивідуальний підбір комплекту',
        page: window.location.pathname,
        pageTitle: document.title,
        source: { id: 'custom-inline', button: 'Підібрати комплект' },
        fields,
        message: String(fd.get('message') ?? '').trim(),
      },
      fd.get('website'),
    );
  }

  return (
    <section id="pidbir" className="relative scroll-mt-24 py-20 sm:py-24 lg:py-28">
      <Container>
        <Reveal>
          <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10">
            {/* Background: a lamp burning in a dark room. */}
            <div aria-hidden className="absolute inset-0">
              <Image
                src={media.warmRoom}
                alt=""
                fill
                quality={75}
                sizes="100vw"
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-abyss via-abyss/92 to-abyss/55" />
              <div className="absolute inset-0 bg-gradient-to-t from-abyss/90 via-transparent to-abyss/60" />
            </div>

            <div className="relative grid gap-10 p-6 sm:p-9 lg:grid-cols-[1fr_1fr] lg:gap-14 lg:p-12">
              <div>
                <p className="flex items-center gap-3">
                  <span className="tnum text-xs text-ember-600">05</span>
                  <span aria-hidden className="h-px w-8 bg-ember-500/50" />
                  <span className="eyebrow">Індивідуальний підбір</span>
                </p>
                <h2 className="font-heading mt-5 text-[clamp(1.6rem,4.2vw,2.6rem)] leading-[1.1] text-cloud">
                  Базовий комплект — не догма.{' '}
                  <span className="text-ember-sheen">Зберемо під ваш дім</span>
                </h2>
                <p className="mt-5 max-w-lg text-[0.98rem] leading-relaxed text-mist">
                  Свердловина на 1,5 кВт, майстерня з компресором, три поверхи з двома котлами —
                  усе це рахується інакше. Позначте два орієнтири, і ми повернемось із
                  конфігурацією: потужність інвертора, кількість акумуляторів, ціна.
                </p>

                <div className="mt-8 space-y-6">
                  <ChipRow
                    legend="Яка потужність потрібна"
                    options={POWER}
                    value={power}
                    onChange={setPower}
                  />
                  <ChipRow
                    legend="На скільки має вистачати"
                    options={CAPACITY}
                    value={capacity}
                    onChange={setCapacity}
                  />
                </div>
              </div>

              {/* Form */}
              <div className="panel rounded-3xl p-5 sm:p-7">
                <AnimatePresence mode="wait" initial={false}>
                  {status === 'success' ? (
                    <motion.div
                      key="done"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-start gap-4 py-6"
                      role="status"
                    >
                      <span className="grid size-14 place-items-center rounded-2xl border border-volt-400/40 bg-volt-400/10">
                        <Check aria-hidden className="size-7 text-volt-400" />
                      </span>
                      <h3 className="font-heading text-xl text-cloud">Заявку прийнято</h3>
                      <p className="text-sm leading-relaxed text-mist">
                        {site.responseTime}. Підготуємо конфігурацію під ваші орієнтири.
                      </p>
                    </motion.div>
                  ) : (
                    <motion.form
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onSubmit={onSubmit}
                      noValidate
                      className="grid gap-3.5"
                    >
                      <p className="font-heading text-lg text-cloud">Отримати конфігурацію</p>

                      <input
                        type="text"
                        name="website"
                        tabIndex={-1}
                        autoComplete="off"
                        aria-hidden
                        className="absolute left-[-9999px] h-0 w-0 opacity-0"
                      />

                      <div>
                        <label htmlFor="ck-name" className="mb-1.5 block text-xs font-semibold text-mist">
                          Ім’я <span className="text-ember-400">*</span>
                        </label>
                        <input
                          id="ck-name"
                          name="name"
                          required
                          autoComplete="name"
                          placeholder="Олександр"
                          className={fieldClass}
                        />
                      </div>

                      <div>
                        <label htmlFor="ck-phone" className="mb-1.5 block text-xs font-semibold text-mist">
                          Телефон <span className="text-ember-400">*</span>
                        </label>
                        <input
                          id="ck-phone"
                          name="phone"
                          type="tel"
                          inputMode="tel"
                          required
                          autoComplete="tel"
                          placeholder="+38 (0__) ___-__-__"
                          className={fieldClass}
                        />
                      </div>

                      <div>
                        <label htmlFor="ck-message" className="mb-1.5 block text-xs font-semibold text-mist">
                          Коментар
                        </label>
                        <textarea
                          id="ck-message"
                          name="message"
                          rows={3}
                          placeholder="Що саме має працювати: котел, свердловина, майстерня…"
                          className={fieldClass}
                        />
                      </div>

                      {status === 'error' && (
                        <p role="alert" className="text-sm text-alarm-300">
                          {error}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={status === 'submitting'}
                        className="group inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-ember-300 to-ember-500 px-6 font-bold text-abyss shadow-[0_10px_32px_-12px_rgba(246,133,14,0.85)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {status === 'submitting' ? (
                          <>
                            <Loader2 aria-hidden className="size-4 animate-spin" /> Надсилаємо…
                          </>
                        ) : (
                          <>
                            Підібрати комплект
                            <ArrowRight
                              aria-hidden
                              className="size-4 transition-transform group-hover:translate-x-1"
                            />
                          </>
                        )}
                      </button>

                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/8 pt-3">
                        <a
                          href={site.phone.href}
                          className="inline-flex min-h-11 items-center gap-2 text-sm text-frost transition-colors hover:text-ember-300"
                        >
                          <Phone aria-hidden className="size-4 text-ember-400" />
                          <span className="tnum">{site.phone.display}</span>
                        </a>
                        <p className="text-[0.7rem] text-dim">Консультація безкоштовна</p>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

function ChipRow({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: { id: string; label: string; hint: string }[];
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  return (
    <fieldset>
      <legend className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ash">
        {legend}
      </legend>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
        {options.map((o) => {
          const active = value === o.id;
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(active ? null : o.id)}
              className={cn(
                'cursor-pointer rounded-xl border px-3 py-2.5 text-left transition-colors',
                active
                  ? 'border-ember-400/60 bg-ember-400/12'
                  : 'border-white/10 bg-white/[0.02] hover:border-white/25',
              )}
            >
              <span
                className={cn(
                  'block text-[0.82rem] font-semibold leading-tight',
                  active ? 'text-ember-100' : 'text-frost',
                )}
              >
                {o.label}
              </span>
              <span className="mt-0.5 block text-[0.68rem] leading-snug text-dim">{o.hint}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
