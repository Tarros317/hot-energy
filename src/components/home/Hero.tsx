'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { ArrowRight, ShieldCheck, Truck, Zap } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { HeroBackdrop } from '@/components/home/HeroBackdrop';
import { PowerStatus } from '@/components/home/PowerStatus';
import { openLeadModal } from '@/components/lead/LeadModal';
import { LEAD_FORMS } from '@/lib/lead-forms';
import { battery, inverter, kit } from '@/lib/kit';
import { media } from '@/lib/media';
import { site, uah } from '@/lib/site';

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Hero. Three depth planes move at different speeds as the page scrolls —
 * photograph slowest, schematic mid, content fastest — which is what sells the
 * parallax without touching layout: every plane is a `transform` only.
 *
 * PERFORMANCE NOTES — this block dropped frames on desktop until three things
 * were fixed, none of them obvious:
 *
 * 1. Motion never emits `will-change` on its own, so a transform written from
 *    JS onto an unpromoted element takes Blink's repaint path instead of
 *    `DirectlyUpdateTransform`. The two backdrop planes therefore ask for
 *    promotion explicitly. The CONTENT plane deliberately does not: promoting
 *    it would cost the headline its subpixel antialiasing while the page sits
 *    still, and it already gets an effect node from `opacity` the moment the
 *    visitor scrolls.
 * 2. No `useSpring` on the parallax. Lenis already low-passes the scroll
 *    signal; a second spring on top reads as lag, not as smoothness.
 * 3. The photograph is ONE <Image>. It used to be two — desktop and mobile —
 *    but both pointed at the same photograph, and a `display:none` <img> is
 *    still fetched.
 */
export function Hero() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });

  const photoY = useTransform(scrollYProgress, [0, 1], ['0%', reduce ? '0%' : '18%']);
  const gridY = useTransform(scrollYProgress, [0, 1], ['0%', reduce ? '0%' : '10%']);
  // Floored at the same progress as the fade: past 0.55 the plane sits at
  // opacity 0.2 and per-frame style writes to it buy nothing visible.
  const contentY = useTransform(scrollYProgress, [0, 0.55], ['0%', reduce ? '0%' : '-6%']);
  // Reaches its floor while the section is still on screen, so the compositor
  // stops being handed a new opacity every frame for the rest of the scroll.
  const contentFade = useTransform(scrollYProgress, [0, 0.55], [1, reduce ? 1 : 0.2]);

  const container = {
    hidden: {},
    visible: { transition: { staggerChildren: reduce ? 0 : 0.09, delayChildren: 0.1 } },
  };
  const item = {
    hidden: { opacity: 0, y: reduce ? 0 : 22 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.75, ease: EASE } },
  };

  return (
    <section
      ref={ref}
      className="relative isolate flex min-h-[100svh] items-center overflow-hidden pb-16 pt-32 sm:pb-24 sm:pt-36 lg:min-h-dvh lg:pt-40"
    >
      {/* Plane 1 — photograph. A dark block of flats with one lit window. */}
      <motion.div style={{ y: photoY, willChange: 'transform' }} className="absolute inset-0 -z-30">
        <Image
          src={media.hero}
          alt=""
          fill
          priority
          quality={75}
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Both scrims in ONE quad with two background layers. As two stacked
            divs over a 70 %-opaque photo this was three translucent
            full-viewport surfaces that nothing could occlude; the photo is now
            opaque and its old 0.70 is folded into the vertical scrim's alpha
            (1 − 0.7·(1 − a)), which is pixel-equivalent. */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgb(6 8 11 / 1) 0%, rgb(6 8 11 / 0.6) 50%, rgb(6 8 11 / 0.2) 100%),' +
              'linear-gradient(to bottom, rgb(6 8 11 / 0.895) 0%, rgb(6 8 11 / 0.79) 50%, rgb(6 8 11 / 1) 100%)',
          }}
        />
      </motion.div>

      {/* Plane 2 — schematic + glows */}
      <motion.div style={{ y: gridY, willChange: 'transform' }} className="absolute inset-0 -z-20">
        <HeroBackdrop />
      </motion.div>
      {/* Tint baked into the line colour rather than applied as `opacity-45`,
          which would cost a full-viewport render surface for a static div. */}
      <div
        aria-hidden
        className="grid-lines absolute inset-0 -z-10"
        style={{ '--grid-line': 'rgb(255 255 255 / 0.02)' } as React.CSSProperties}
      />

      {/* Plane 3 — content */}
      <motion.div style={{ y: contentY, opacity: contentFade }} className="relative w-full">
        <Container>
          <motion.div
            variants={container}
            initial="hidden"
            animate="visible"
            className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16"
          >
            <div>
              <motion.div variants={item} className="flex flex-wrap items-center gap-2.5">
                <span className="badge inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[0.72rem] font-semibold">
                  <span className="relative flex size-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ember-400 opacity-75" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-ember-400" />
                  </span>
                  Є в наявності · {site.serviceArea}
                </span>
                <span className="rounded-full border border-white/10 px-3 py-1.5 text-[0.72rem] text-mist">
                  Готовий до роботи «з коробки»
                </span>
              </motion.div>

              <motion.h1
                variants={item}
                className="font-heading mt-6 text-[clamp(2.1rem,7vw,4.1rem)] leading-[1.02] tracking-tight text-cloud text-shadow-soft"
              >
                Домашній комплект
                <br />
                безперебійного живлення
                <br />
                <span className="font-display text-ember-sheen text-[clamp(2.3rem,7.6vw,4.6rem)]">
                  від 4 кВт·год
                </span>
              </motion.h1>

              <motion.p
                variants={item}
                className="mt-6 max-w-xl text-base leading-relaxed text-mist sm:text-lg"
              >
                Світло, інтернет, холодильник і газовий котел продовжують працювати так, ніби
                нічого не сталося. Перемикання — за {inverter.transferMsPc} мілісекунд: комп’ютер
                не перезавантажиться, котел не скине налаштування.
              </motion.p>

              <motion.div variants={item} className="mt-8 flex flex-wrap items-end gap-x-6 gap-y-3">
                <div>
                  <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-ash">
                    Ціна комплекту
                  </p>
                  <p className="font-display mt-1.5 text-[2.4rem] leading-none text-cloud sm:text-[2.9rem]">
                    {uah(kit.priceUah)}&nbsp;<span className="text-ember-400">₴</span>
                  </p>
                </div>
                <p className="max-w-[15rem] text-sm leading-snug text-ash">
                  Інвертор + акумулятор + кабелі. Без прихованих доплат за «монтажний набір».
                </p>
              </motion.div>

              <motion.div variants={item} className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() =>
                    openLeadModal({
                      config: LEAD_FORMS.hero,
                      source: { id: 'hero-primary', button: 'Замовити комплект' },
                    })
                  }
                  className="group inline-flex min-h-13 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-ember-300 to-ember-500 px-7 text-[1rem] font-bold text-abyss shadow-[0_12px_40px_-12px_rgba(246,133,14,0.9)] transition-transform hover:-translate-y-0.5"
                >
                  Замовити комплект
                  <ArrowRight
                    aria-hidden
                    className="size-4.5 transition-transform group-hover:translate-x-1"
                  />
                </button>
                <a
                  href="#kalkulyator"
                  className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl border border-white/14 bg-white/4 px-7 text-[1rem] font-semibold text-frost transition-colors hover:border-ember-400/50 hover:bg-ember-400/5"
                >
                  Порахувати автономність
                </a>
              </motion.div>

              <motion.ul
                variants={item}
                className="mt-9 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-white/8 pt-7 sm:grid-cols-4"
              >
                <Spec value="4,02" unit="кВт·год" label="Ємність банку" />
                <Spec value={String(inverter.powerW)} unit="Вт" label={`Пік ${inverter.peakVA} ВА`} />
                <Spec value={String(inverter.mppt.currentA)} unit="А MPPT" label="Готовий до панелей" />
                <Spec value={String(battery.warrantyMonths)} unit="місяців" label="Гарантія на АКБ" />
              </motion.ul>
            </div>

            {/* Right: the product, floating, with its own status panel. */}
            <motion.div variants={item} className="relative mx-auto w-full max-w-md lg:max-w-none">
              <FloatingProduct />
              <PowerStatus className="relative z-10 mx-auto mt-6 w-full max-w-sm lg:mt-0 lg:ml-auto lg:mr-0" />

              <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-ash lg:justify-end">
                <li className="flex items-center gap-1.5">
                  <ShieldCheck aria-hidden className="size-3.5 text-ember-400" />
                  LiFePO₄, {battery.cycles.toLocaleString('uk-UA')} циклів
                </li>
                <li className="flex items-center gap-1.5">
                  <Zap aria-hidden className="size-3.5 text-ember-400" />
                  Чиста синусоїда
                </li>
                <li className="flex items-center gap-1.5">
                  <Truck aria-hidden className="size-3.5 text-ember-400" />
                  Доставка 1–3 дні
                </li>
              </ul>
            </motion.div>
          </motion.div>
        </Container>
      </motion.div>
    </section>
  );
}

function Spec({ value, unit, label }: { value: string; unit: string; label: string }) {
  return (
    <li>
      <p className="flex items-baseline gap-1">
        <span className="tnum text-2xl font-bold text-cloud sm:text-[1.65rem]">{value}</span>
        <span className="text-xs font-semibold text-ember-400">{unit}</span>
      </p>
      <p className="mt-1 text-xs leading-snug text-ash">{label}</p>
    </li>
  );
}

/** Inverter and battery drifting slightly out of phase — depth without weight.
 *  The floats are CSS keyframes now, and the global prefers-reduced-motion
 *  rule in globals.css flattens them — no JS gate needed. */
function FloatingProduct() {
  return (
    <div className="relative mx-auto hidden h-72 w-full max-w-sm lg:block">
      {/* Gradient, not a blurred fill — same glow, no offscreen filter pass. */}
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(246,133,14,0.22) 0%, rgba(246,133,14,0.08) 38%, transparent 72%)',
        }}
      />
      {/* drop-shadow sits on the element that MOVES, not on the <img> inside
          it: with filter and transform on one layer Chrome rasterises the
          shadow once and re-translates the cached texture each frame. */}
      <div
        className="float-y absolute left-0 top-2 w-[58%] drop-shadow-[0_16px_32px_rgba(0,0,0,0.7)]"
        style={{ '--float': '-12px', '--float-dur': '7s' } as React.CSSProperties}
      >
        <Image
          src={media.inverterAngle}
          alt={`Інвертор ${inverter.brand} ${inverter.model}`}
          width={1198}
          height={1502}
          quality={75}
          sizes="(max-width: 1024px) 0px, 220px"
          className="h-auto w-full"
        />
      </div>
      <div
        className="float-y absolute bottom-0 right-0 w-[62%] drop-shadow-[0_16px_32px_rgba(0,0,0,0.75)]"
        style={{ '--float': '10px', '--float-dur': '8.5s', animationDelay: '0.6s' } as React.CSSProperties}
      >
        <Image
          src={media.battery}
          alt={`Акумулятор ${battery.brand} ${battery.model}`}
          width={1290}
          height={871}
          quality={75}
          sizes="(max-width: 1024px) 0px, 240px"
          className="h-auto w-full"
        />
      </div>
    </div>
  );
}
