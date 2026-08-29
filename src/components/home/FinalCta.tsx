'use client';

import { ArrowRight, Phone } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { ParallaxPhoto } from '@/components/ui/ParallaxPhoto';
import { Counter } from '@/components/ui/Counter';
import { openLeadModal } from '@/components/lead/LeadModal';
import { LEAD_FORMS } from '@/lib/lead-forms';
import { battery, inverter, kit } from '@/lib/kit';
import { media } from '@/lib/media';
import { site, uah } from '@/lib/site';

export function FinalCta() {
  return (
    <section className="relative isolate overflow-hidden">
      <ParallaxPhoto
        src={media.cityNight}
        alt=""
        className="absolute inset-0 -z-10 h-full w-full"
        sizes="100vw"
        amount={10}
        overlay="heavy"
        quality={70}
      />

      <Container className="relative py-24 sm:py-28 lg:py-36">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">Наступне відключення вже в графіку</p>
          <h2 className="font-heading mt-5 text-[clamp(1.9rem,5.4vw,3.4rem)] leading-[1.05] text-cloud text-shadow-soft">
            У вашому вікні світло{' '}
            <span className="text-ember-sheen">має горіти теж</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-[1.02rem] leading-relaxed text-mist sm:text-lg">
            Комплект приїде зібраним і підписаним. Усе, що потрібно від вас, — розетка й пів години
            часу. Далі про графіки відключень нагадуватимуть тільки новини.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() =>
                openLeadModal({
                  config: LEAD_FORMS.final,
                  source: { id: 'final-cta', button: 'Замовити комплект' },
                })
              }
              className="group inline-flex min-h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-ember-300 to-ember-500 px-8 text-[1rem] font-bold text-abyss shadow-[0_14px_44px_-14px_rgba(246,133,14,0.95)] transition-transform hover:-translate-y-0.5 sm:w-auto"
            >
              Замовити за {uah(kit.priceUah)} ₴
              <ArrowRight
                aria-hidden
                className="size-4.5 transition-transform group-hover:translate-x-1"
              />
            </button>
            <a
              href={site.phone.href}
              className="inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/4 px-7 text-[1rem] font-semibold text-frost transition-colors hover:border-ember-400/50 hover:bg-ember-400/5 sm:w-auto"
            >
              <Phone aria-hidden className="size-4 text-ember-400" />
              <span className="tnum">{site.phone.display}</span>
            </a>
          </div>

          <dl className="mx-auto mt-14 grid max-w-2xl grid-cols-2 gap-x-6 gap-y-8 border-t border-white/10 pt-10 sm:grid-cols-4">
            <Stat value={<Counter to={4.02} decimals={2} />} unit="кВт·год" label="базова ємність" />
            <Stat value={<Counter to={inverter.transferMsPc} />} unit="мс" label="перемикання" />
            <Stat
              value={<Counter to={battery.cycles} />}
              unit="циклів"
              label="ресурс акумулятора"
            />
            <Stat
              value={<Counter to={battery.warrantyYears} />}
              unit="років"
              label="гарантія на АКБ"
            />
          </dl>
        </Reveal>
      </Container>
    </section>
  );
}

function Stat({
  value,
  unit,
  label,
}: {
  value: React.ReactNode;
  unit: string;
  label: string;
}) {
  return (
    <div className="flex flex-col">
      <dd className="order-1">
        <span className="tnum block text-[1.8rem] font-bold leading-none text-cloud sm:text-[2.1rem]">
          {value}
        </span>
        <span className="mt-1.5 block text-xs font-semibold text-ember-400">{unit}</span>
      </dd>
      <dt className="order-2 mt-1 text-[0.72rem] leading-snug text-ash">{label}</dt>
    </div>
  );
}
