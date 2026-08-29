'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Check, PackageCheck } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Reveal, RevealItem } from '@/components/ui/Reveal';
import { openLeadModal } from '@/components/lead/LeadModal';
import { LEAD_FORMS } from '@/lib/lead-forms';
import { battery, inverter, kit } from '@/lib/kit';
import { media } from '@/lib/media';
import { uah } from '@/lib/site';

/**
 * What is actually in the box. Two product cards, then the packing list and
 * the price — the block that answers «за що я плачу 45 тисяч» before the
 * visitor reaches the technical sections.
 */
export function Kit() {
  const reduce = useReducedMotion();

  return (
    <section id="komplekt" className="relative scroll-mt-24 overflow-hidden py-20 sm:py-24 lg:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent"
      />

      <Container className="relative">
        <Reveal as="header" className="max-w-3xl">
          <p className="flex items-center gap-3">
            <span className="tnum text-xs text-ember-600">01</span>
            <span aria-hidden className="h-px w-8 bg-ember-500/50" />
            <span className="eyebrow">Що входить у комплект</span>
          </p>
          <h2 className="font-heading mt-5 text-[clamp(1.75rem,4.6vw,3rem)] leading-[1.08] text-cloud">
            Дві коробки — і розетки в домі{' '}
            <span className="text-ember-sheen">більше не гаснуть</span>
          </h2>
          <p className="mt-5 text-[1.02rem] leading-relaxed text-mist sm:text-lg">
            Комплект зібраний як одне ціле: інвертор і акумулятор підібрані під одну напругу,
            один струм і один сценарій — квартиру чи будинок під час планових відключень.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <ProductCard
            href="#invertor"
            eyebrow="Мозок системи"
            title={inverter.model}
            brand={inverter.brand}
            image={media.inverterAngle}
            imageAlt={`Інвертор ${inverter.brand} ${inverter.model}`}
            width={1198}
            height={1502}
            imageClass="max-h-[15rem] sm:max-h-[17rem]"
            specs={[
              { k: 'Потужність', v: `${inverter.powerW} Вт · ${inverter.peakVA} ВА пік` },
              { k: 'Перемикання', v: `${inverter.transferMsPc} мс` },
              { k: 'Сонячний контролер', v: `MPPT ${inverter.mppt.currentA} А, вбудований` },
            ]}
            reduce={reduce}
          />
          <ProductCard
            href="#akumulyator"
            eyebrow="Запас енергії"
            title={battery.model}
            brand={battery.brand}
            image={media.battery}
            imageAlt={`Акумулятор ${battery.brand} ${battery.model}`}
            width={1290}
            height={871}
            imageClass="max-h-[13rem] sm:max-h-[15rem]"
            specs={[
              { k: 'Ємність', v: '4 019 Вт·год (4,02 кВт·год)' },
              { k: 'Ресурс', v: `${battery.cycles.toLocaleString('uk-UA')} циклів` },
              { k: 'Захист', v: `BMS ${battery.bmsA} А, ${battery.ip}` },
            ]}
            reduce={reduce}
          />
        </div>

        {/* Packing list + price */}
        <div className="mt-5 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <Reveal className="panel rounded-3xl p-6 sm:p-8" stagger={reduce ? 0 : 0.06}>
            <RevealItem>
              <p className="flex items-center gap-2.5">
                <PackageCheck aria-hidden className="size-4 text-ember-400" />
                <span className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ash">
                  У коробці, без доплат
                </span>
              </p>
            </RevealItem>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {kit.includes.map((line) => (
                <RevealItem key={line} as="li" className="flex gap-2.5">
                  <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-volt-400" />
                  <span className="text-[0.88rem] leading-relaxed text-mist">{line}</span>
                </RevealItem>
              ))}
            </ul>
          </Reveal>

          <Reveal className="relative overflow-hidden rounded-3xl border border-ember-400/25 bg-gradient-to-br from-ember-500/12 via-ink-900 to-ink-950 p-6 sm:p-8">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-ember-500/25 blur-3xl"
            />
            <div className="relative">
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ember-300">
                Ціна комплекту
              </p>
              <p className="font-display mt-3 text-[2.6rem] leading-none text-cloud">
                {uah(kit.priceUah)}&nbsp;<span className="text-ember-400">₴</span>
              </p>
              <p className="mt-3 text-sm leading-relaxed text-mist">
                Інвертор, акумулятор, кабелі, запобіжник і кріплення. Далі — тільки розетка.
              </p>

              <button
                type="button"
                onClick={() =>
                  openLeadModal({
                    config: LEAD_FORMS.hero,
                    source: { id: 'kit-price', button: 'Замовити комплект' },
                  })
                }
                className="group mt-6 inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-ember-300 to-ember-500 px-6 font-bold text-abyss shadow-[0_10px_32px_-12px_rgba(246,133,14,0.85)] transition-transform hover:-translate-y-0.5"
              >
                Замовити комплект
                <ArrowRight
                  aria-hidden
                  className="size-4 transition-transform group-hover:translate-x-1"
                />
              </button>

              <p className="mt-4 text-[0.72rem] leading-snug text-ash">
                Потрібно більше годин автономності — доберемо другий, третій або четвертий
                акумулятор до цього ж інвертора.
              </p>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

function ProductCard({
  href,
  eyebrow,
  title,
  brand,
  image,
  imageAlt,
  width,
  height,
  imageClass,
  specs,
  reduce,
}: {
  href: string;
  eyebrow: string;
  title: string;
  brand: string;
  image: string;
  imageAlt: string;
  width: number;
  height: number;
  imageClass: string;
  specs: { k: string; v: string }[];
  reduce: boolean | null;
}) {
  return (
    <Reveal className="panel group relative overflow-hidden rounded-3xl p-6 sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-8 h-64 w-64 -translate-x-1/2 rounded-full bg-ember-500/14 blur-3xl transition-opacity duration-500 group-hover:bg-ember-500/22"
      />

      <div className="relative flex h-52 items-center justify-center sm:h-60">
        <motion.div
          animate={reduce ? undefined : { y: [0, -8, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="flex h-full items-center"
        >
          <Image
            src={image}
            alt={imageAlt}
            width={width}
            height={height}
            quality={85}
            sizes="(max-width: 1024px) 80vw, 380px"
            className={`w-auto object-contain drop-shadow-[0_20px_44px_rgba(0,0,0,0.65)] ${imageClass}`}
          />
        </motion.div>
      </div>

      <div className="relative mt-6">
        <p className="eyebrow">{eyebrow}</p>
        <h3 className="font-heading mt-2 text-xl leading-tight text-cloud sm:text-2xl">{title}</h3>
        <p className="mt-1 text-sm text-ash">{brand}</p>

        <dl className="mt-5 space-y-2.5 border-t border-white/8 pt-5">
          {specs.map((s) => (
            <div key={s.k} className="flex items-baseline justify-between gap-4">
              <dt className="text-[0.82rem] text-ash">{s.k}</dt>
              <dd className="text-right text-[0.85rem] font-semibold text-frost">{s.v}</dd>
            </div>
          ))}
        </dl>

        <a
          href={href}
          className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-ember-300 transition-colors hover:text-ember-200"
        >
          Докладно про пристрій
          <ArrowRight aria-hidden className="size-3.5" />
        </a>
      </div>
    </Reveal>
  );
}
