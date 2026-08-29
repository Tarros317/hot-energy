'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'motion/react';
import { Activity, Snowflake, SunMedium, Timer, Waves, Wifi } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Reveal, RevealItem } from '@/components/ui/Reveal';
import { PowerFlow } from '@/components/home/PowerFlow';
import { openLeadModal } from '@/components/lead/LeadModal';
import { LEAD_FORMS } from '@/lib/lead-forms';
import { inverter } from '@/lib/kit';
import { media } from '@/lib/media';

/**
 * The inverter, explained through what a household actually notices —
 * the router that doesn't reboot, the boiler pump that doesn't buzz — rather
 * than through a list of adjectives about quality.
 */

const STORIES = [
  {
    icon: Timer,
    title: `${inverter.transferMsPc} мілісекунд`,
    text: 'Стільки триває перехід на акумулятор. Комп’ютер не встигає перезавантажитись, роутер не втрачає з’єднання, а газовий котел не скидає програму опалення й не вимагає ручного перезапуску.',
  },
  {
    icon: Waves,
    title: 'Чиста синусоїда',
    text: 'На дешевій «модифікованій» синусоїді насос котла гуде, холодильник гріється, а блоки живлення старіють швидше. Тут форма напруги така сама, як у мережі, — техніка просто не помічає різниці.',
  },
  {
    icon: SunMedium,
    title: `Контролер MPPT ${inverter.mppt.currentA} А вже всередині`,
    text: `Окремий сонячний контролер такого класу коштує як половина інвертора. Тут він вбудований: коли з’явиться бажання додати панелі, знадобляться самі панелі й кабель — до ${inverter.mppt.maxPvW} Вт масиву, напруга ${inverter.mppt.pvVoltage}.`,
  },
  {
    icon: Snowflake,
    title: 'Холодний старт і пробудження АКБ',
    text: 'Інвертор вмикається без мережі — від самої батареї. А якщо акумулятор колись піде в глибокий розряд, пристрій «розбудить» його замість того, щоб показати помилку й чекати сервісу.',
  },
  {
    icon: Wifi,
    title: 'Wi-Fi-модуль і LCD',
    text: 'Заряд, споживання і режим видно на екрані та в телефоні. Зручно, коли треба перевірити стан системи з роботи — або зрозуміти, чому за вечір «з’їлося» більше, ніж зазвичай.',
  },
  {
    icon: Activity,
    title: `Заряд від мережі до ${inverter.acChargerA} А`,
    text: 'Між відключеннями банк встигає набрати заряд навіть у короткому вікні: чотири кіловат-години повертаються приблизно за ніч, а не за добу.',
  },
];

const SPECS: { k: string; v: string }[] = [
  { k: 'Номінальна потужність', v: `${inverter.powerW} Вт` },
  { k: 'Пікова потужність', v: `${inverter.peakVA} ВА` },
  { k: 'Напруга акумулятора', v: `${inverter.batteryV} В` },
  { k: 'Вихідна напруга', v: inverter.outputV },
  { k: 'Частота', v: inverter.frequency },
  { k: 'Форма сигналу', v: inverter.waveform },
  { k: 'Час перемикання', v: `${inverter.transferMsPc} мс (ПК) / ${inverter.transferMsHome} мс (побутова техніка)` },
  { k: 'Власне споживання', v: `${inverter.idleW} Вт` },
  { k: 'Зарядний струм від мережі', v: `до ${inverter.acChargerA} А` },
  { k: 'Сонячний контролер', v: `MPPT ${inverter.mppt.currentA} А, ${inverter.mppt.pvVoltage}` },
  { k: 'Габарити', v: `${inverter.sizeMm} мм` },
  { k: 'Вага', v: `${inverter.weightKg} кг` },
  { k: 'Робоча температура', v: inverter.tempRange },
  { k: 'Гарантія', v: `${inverter.warrantyMonths} місяці` },
];

export function Inverter() {
  const reduce = useReducedMotion();

  return (
    <section id="invertor" className="relative scroll-mt-24 py-20 sm:py-24 lg:py-28">
      {/* Section texture: an electrical panel, dimmed almost to a shadow.
          The clipping lives HERE and not on the <section>: an ancestor with
          hidden overflow becomes the nearest scrollport for a sticky
          descendant, and since the section never scrolls, the left column
          would silently refuse to pin. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <Image
          src={media.wiring}
          alt=""
          fill
          quality={60}
          sizes="100vw"
          className="object-cover opacity-[0.07]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-abyss via-abyss/85 to-abyss" />
      </div>

      <Container className="relative">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          {/* Sticky product plinth */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Reveal>
              <div className="relative flex items-center justify-center overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-b from-ink-850 to-ink-950 px-6 py-10 sm:py-14">
                <div
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ember-500/18 blur-3xl"
                />
                <div aria-hidden className="grid-lines absolute inset-0 opacity-50" />
                <motion.div
                  animate={reduce ? undefined : { y: [0, -10, 0] }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative"
                >
                  <Image
                    src={media.inverterFront}
                    alt={`Інвертор ${inverter.brand} ${inverter.model}, вигляд спереду`}
                    width={1209}
                    height={1384}
                    quality={85}
                    sizes="(max-width: 1024px) 70vw, 380px"
                    className="mx-auto h-auto w-full max-w-[17rem] drop-shadow-[0_28px_56px_rgba(0,0,0,0.7)]"
                  />
                </motion.div>
              </div>
            </Reveal>

            <Reveal className="mt-4 grid grid-cols-3 gap-2.5">
              {[
                { v: `${inverter.powerW}`, u: 'Вт', l: 'номінал' },
                { v: `${inverter.peakVA}`, u: 'ВА', l: 'пік' },
                { v: `${inverter.mppt.currentA}`, u: 'А', l: 'MPPT' },
              ].map((s) => (
                <div key={s.l} className="panel rounded-2xl px-3 py-3.5 text-center">
                  <p className="tnum text-xl font-bold text-cloud">{s.v}</p>
                  <p className="text-[0.62rem] font-semibold text-ember-400">{s.u}</p>
                  <p className="mt-1 font-mono text-[0.58rem] uppercase tracking-[0.14em] text-dim">
                    {s.l}
                  </p>
                </div>
              ))}
            </Reveal>
          </div>

          {/* Narrative */}
          <div>
            <Reveal as="header">
              <p className="flex items-center gap-3">
                <span className="tnum text-xs text-ember-600">03</span>
                <span aria-hidden className="h-px w-8 bg-ember-500/50" />
                <span className="eyebrow">Інвертор {inverter.brand}</span>
              </p>
              <h2 className="font-heading mt-5 text-[clamp(1.75rem,4.6vw,2.75rem)] leading-[1.08] text-cloud">
                {inverter.shortModel}
                <br />
                <span className="text-ember-sheen">Мозок, який ловить момент</span>
              </h2>
              <p className="mt-5 text-[1.02rem] leading-relaxed text-mist">
                Інвертор — це не «коробка з розеткою». Це пристрій, який щомиті вирішує, звідки
                брати струм, і робить перемикання швидше, ніж встигає моргнути лампочка. Ось що з
                цього виходить у звичайному домі.
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
              <PowerFlow />
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
                    config: LEAD_FORMS.inverter,
                    source: { id: 'inverter', button: 'Запитати про інвертор' },
                  })
                }
                className="inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border border-ember-400/40 px-6 font-semibold text-frost transition-colors hover:border-ember-300 hover:bg-ember-400/10"
              >
                Запитати про інвертор
              </button>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
