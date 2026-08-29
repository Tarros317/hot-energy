'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'motion/react';
import { Bluetooth, Droplets, Layers, ShieldCheck, Thermometer, Weight } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Reveal, RevealItem } from '@/components/ui/Reveal';
import { BatteryLife } from '@/components/home/BatteryLife';
import { openLeadModal } from '@/components/lead/LeadModal';
import { LEAD_FORMS } from '@/lib/lead-forms';
import { battery } from '@/lib/kit';
import { media } from '@/lib/media';

/**
 * The battery. Same rule as the inverter block: describe what changes in the
 * flat, not how good the product is.
 */

const STORIES = [
  {
    icon: Weight,
    title: '28 кілограмів замість ста тридцяти',
    text: 'Щоб набрати ті самі чотири кіловат-години на свинці, потрібно чотири-п’ять важких банок, стелаж і окремий кут у коридорі. Тут це одна коробка розміром із дорожню валізу, яка стає під стіл або в шафу.',
  },
  {
    icon: ShieldCheck,
    title: 'Літій-залізо-фосфат, а не «просто літій»',
    text: 'LiFePO₄ — найспокійніша з літієвих хімій: вона термічно стабільна й не схильна до займання навіть при пошкодженні. Саме тому цю хімію ставлять у домашні накопичувачі, а не в компактні гаджети, де важлива щільність.',
  },
  {
    icon: Layers,
    title: `BMS на ${battery.bmsA} ампер`,
    text: `Плата захисту тримає до ${battery.bmsOutputW.toLocaleString('uk-UA')} Вт — більше, ніж здатен видати інвертор. Отже, обмежувати систему буде інвертор, а не батарея: BMS не «зріже» живлення на пусковому струмі насоса.`,
  },
  {
    icon: Bluetooth,
    title: 'Видно, що всередині',
    text: `${battery.bluetooth} показує напругу кожної групи комірок, струм, температуру й залишок ємності. Не для краси: якщо банк почне поводитися інакше, ви побачите це на графіку, а не за фактом відмови.`,
  },
  {
    icon: Droplets,
    title: `Корпус ${battery.ip}`,
    text: 'Пил, бризки й вологий підвал батареї не шкодять. Клеми M8 закриті, ручки-троси витримують вагу — переставити її вдвох реально навіть у вузькому коридорі.',
  },
  {
    icon: Thermometer,
    title: 'Про мороз — чесно',
    text: `Розряджати батарею можна від −20 °C, а от заряджати — тільки від 0 °C: це фізика літію, а не недолік моделі. Для неопалюваного гаража це означає одне — ставити ближче до тепла.`,
  },
];

const SPECS: { k: string; v: string }[] = [
  { k: 'Хімія', v: battery.chemistry },
  { k: 'Номінальна напруга', v: `${battery.nominalV} В`.replace('.', ',') },
  { k: 'Ємність', v: `${battery.capacityAh} А·год` },
  { k: 'Енергія', v: `${battery.energyWh.toLocaleString('uk-UA')} Вт·год` },
  { k: 'BMS', v: `${battery.bmsA} А, до ${battery.bmsOutputW.toLocaleString('uk-UA')} Вт` },
  { k: 'Ресурс', v: `${battery.cycles.toLocaleString('uk-UA')} циклів при DoD ${battery.cycleDod} %` },
  { k: 'Габарити', v: `${battery.sizeMm} мм` },
  { k: 'Вага', v: `${battery.weightKg} кг` },
  { k: 'Клеми', v: battery.terminals },
  { k: 'Захист корпусу', v: battery.ip },
  { k: 'Заряд', v: battery.chargeTemp },
  { k: 'Розряд', v: battery.dischargeTemp },
  { k: 'Саморозряд', v: battery.selfDischarge },
  { k: 'Паралельне з’єднання', v: `до ${battery.maxParallel} шт` },
  { k: 'Сертифікати', v: battery.certificates.join(', ') },
  { k: 'Гарантія', v: `${battery.warrantyYears} років` },
];

export function Battery() {
  const reduce = useReducedMotion();

  return (
    <section
      id="akumulyator"
      className="relative scroll-mt-24 border-y border-white/8 bg-ink-950 py-20 sm:py-24 lg:py-28"
    >
      {/* Clipping lives on the decoration, not on the <section> — see
          Inverter.tsx: `overflow-hidden` there would kill the sticky column. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="grid-lines absolute inset-0 opacity-40" />
        <div className="absolute -left-40 top-1/3 h-96 w-96 rounded-full bg-ember-500/10 blur-3xl" />
      </div>

      <Container className="relative">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          {/* Narrative first on desktop — the photo carries less weight here. */}
          <div className="lg:order-2 lg:sticky lg:top-28 lg:self-start">
            <Reveal>
              <div className="relative flex items-center justify-center overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-b from-ink-850 to-ink-950 px-6 py-10">
                <div
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ember-500/20 blur-3xl"
                />
                <motion.div
                  animate={reduce ? undefined : { y: [0, -9, 0] }}
                  transition={{ duration: 8.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative w-full"
                >
                  <Image
                    src={media.battery}
                    alt={`Акумулятор ${battery.brand} ${battery.model}`}
                    width={1290}
                    height={871}
                    quality={85}
                    sizes="(max-width: 1024px) 85vw, 420px"
                    className="mx-auto h-auto w-full max-w-sm drop-shadow-[0_28px_56px_rgba(0,0,0,0.75)]"
                  />
                </motion.div>
              </div>
            </Reveal>

            <Reveal className="mt-4">
              <BatteryLife />
            </Reveal>
          </div>

          <div className="lg:order-1">
            <Reveal as="header">
              <p className="flex items-center gap-3">
                <span className="tnum text-xs text-ember-600">04</span>
                <span aria-hidden className="h-px w-8 bg-ember-500/50" />
                <span className="eyebrow">Акумулятор {battery.brand}</span>
              </p>
              <h2 className="font-heading mt-5 text-[clamp(1.75rem,4.6vw,2.75rem)] leading-[1.08] text-cloud">
                12 В · 314 А·год
                <br />
                <span className="text-ember-sheen">Чотири кіловат-години в одній коробці</span>
              </h2>
              <p className="mt-5 text-[1.02rem] leading-relaxed text-mist">
                Усередині — чотири призматичні комірки класу A+ і плата захисту, яка стежить за
                кожною з них. Далі найцікавіше починається не в специфікації, а в тому, як це
                виглядає у справжній квартирі.
              </p>
            </Reveal>

            <Reveal className="mt-10 space-y-6" stagger={reduce ? 0 : 0.07}>
              {STORIES.map(({ icon: Icon, title, text }) => (
                <RevealItem key={title} className="flex gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-ember-400/25 bg-ember-400/8 text-ember-300">
                    <Icon aria-hidden className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-heading text-[1.02rem] leading-snug text-cloud">{title}</h3>
                    <p className="mt-1.5 text-[0.9rem] leading-relaxed text-mist">{text}</p>
                  </div>
                </RevealItem>
              ))}
            </Reveal>

            <Reveal className="mt-10">
              <details className="panel group overflow-hidden rounded-3xl">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 sm:px-6">
                  <span className="font-heading text-[0.98rem] text-cloud">
                    Повні технічні характеристики
                  </span>
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/12 text-mist transition-transform group-open:rotate-45">
                    <span aria-hidden className="text-lg leading-none">
                      +
                    </span>
                  </span>
                </summary>
                <dl className="grid gap-x-8 gap-y-0 border-t border-white/8 px-5 py-3 sm:grid-cols-2 sm:px-6">
                  {SPECS.map((s) => (
                    <div
                      key={s.k}
                      className="flex items-baseline justify-between gap-4 border-b border-white/6 py-2.5 last:border-0"
                    >
                      <dt className="text-[0.8rem] text-ash">{s.k}</dt>
                      <dd className="text-right text-[0.82rem] font-medium text-frost">{s.v}</dd>
                    </div>
                  ))}
                </dl>
              </details>
            </Reveal>

            <Reveal className="mt-6">
              <button
                type="button"
                onClick={() =>
                  openLeadModal({
                    config: LEAD_FORMS.battery,
                    source: { id: 'battery', button: 'Порахувати ємність' },
                  })
                }
                className="inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border border-ember-400/40 px-6 font-semibold text-frost transition-colors hover:border-ember-300 hover:bg-ember-400/10"
              >
                Порахувати потрібну ємність
              </button>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
