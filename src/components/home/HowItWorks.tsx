'use client';

import Image from 'next/image';
import { useReducedMotion } from 'motion/react';
import { Cable, PhoneCall, PlugZap, Truck, SunMedium, Ruler, ThermometerSun } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Reveal, RevealItem } from '@/components/ui/Reveal';
import { ParallaxPhoto } from '@/components/ui/ParallaxPhoto';
import { battery, inverter } from '@/lib/kit';
import { media } from '@/lib/media';

/**
 * From order to first outage. Four steps, then the two questions everyone asks
 * before buying: where does it live, and what happens when I want panels.
 */

const STEPS = [
  {
    icon: PhoneCall,
    n: '01',
    title: 'Розмова на 10 хвилин',
    text: 'Питаємо, що має працювати й де стоятиме комплект. Якщо базового вистачає — так і кажемо, замість того щоб продавати вдвічі більше.',
  },
  {
    icon: Truck,
    n: '02',
    title: 'Доставка 1–3 дні',
    text: 'Новою поштою по Україні. Акумулятор їде як вантаж — це 28 кг, тому відділення краще обирати з під’їздом для авто.',
  },
  {
    icon: Cable,
    n: '03',
    title: 'Підключення',
    text: 'Кабелі вже обтиснуті, полярність підписана, запобіжник у комплекті. Інвертор вішається на стіну двома шурупами; окрема лінія на критичні розетки — робота електрика на пів дня.',
  },
  {
    icon: PlugZap,
    n: '04',
    title: 'Перше відключення',
    text: 'Далі система живе сама: заряджається, коли світло є, і підхоплює навантаження, коли його немає. Втручання потрібне приблизно ніколи.',
  },
];

const PLACEMENT = [
  {
    icon: Ruler,
    title: 'Скільки місця',
    text: `Акумулятор — ${battery.sizeMm} мм, інвертор — ${inverter.sizeMm} мм на стіні. Разом це тумба під столом і місце завбільшки з картину над нею.`,
  },
  {
    icon: ThermometerSun,
    title: 'Де саме',
    text: 'Суха опалювана кімната: комора, коридор, технічна ніша. Не на балконі взимку — заряджати літій можна від 0 °C.',
  },
  {
    icon: SunMedium,
    title: 'Якщо потім захочеться панелей',
    text: `MPPT ${inverter.mppt.currentA} А вже стоїть усередині. Додаються тільки панелі до ${inverter.mppt.maxPvW} Вт і кабель — інвертор міняти не доведеться.`,
  },
];

export function HowItWorks() {
  const reduce = useReducedMotion();

  return (
    <section
      id="yak-pratsyuye"
      className="relative scroll-mt-24 overflow-hidden py-20 sm:py-24 lg:py-28"
    >
      <Container>
        <Reveal as="header" className="max-w-3xl">
          <p className="flex items-center gap-3">
            <span className="tnum text-xs text-ember-600">06</span>
            <span aria-hidden className="h-px w-8 bg-ember-500/50" />
            <span className="eyebrow">Як це працює</span>
          </p>
          <h2 className="font-heading mt-5 text-[clamp(1.75rem,4.6vw,3rem)] leading-[1.08] text-cloud">
            Від дзвінка до{' '}
            <span className="text-ember-sheen">тихого вечора зі світлом</span>
          </h2>
        </Reveal>

        <Reveal className="mt-12" stagger={reduce ? 0 : 0.08}>
          <ol className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <span
              aria-hidden
              className="pointer-events-none absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-ember-500/40 via-ember-500/20 to-transparent lg:block"
            />
            {STEPS.map(({ icon: Icon, n, title, text }) => (
              <RevealItem key={n} as="li" className="relative">
                <span className="relative grid size-12 place-items-center rounded-2xl border border-ember-400/30 bg-abyss text-ember-300">
                  <Icon aria-hidden className="size-5" />
                </span>
                <p className="tnum mt-4 text-[0.7rem] font-bold tracking-widest text-ember-600">
                  {n}
                </p>
                <h3 className="font-heading mt-1.5 text-[1.05rem] leading-snug text-cloud">
                  {title}
                </h3>
                <p className="mt-2 text-[0.88rem] leading-relaxed text-mist">{text}</p>
              </RevealItem>
            ))}
          </ol>
        </Reveal>
      </Container>

      {/* Full-bleed photo break */}
      <Reveal className="mt-16">
        <ParallaxPhoto
          src={media.install}
          alt="Електрик підключає обладнання в розподільній шафі"
          className="h-64 w-full sm:h-80 lg:h-96"
          sizes="100vw"
          amount={14}
        />
      </Reveal>

      <Container>
        <Reveal className="mt-14 grid gap-5 md:grid-cols-3" stagger={reduce ? 0 : 0.07}>
          {PLACEMENT.map(({ icon: Icon, title, text }) => (
            <RevealItem key={title} className="panel rounded-3xl p-6">
              <span className="grid size-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.03] text-ember-400">
                <Icon aria-hidden className="size-5" />
              </span>
              <h3 className="font-heading mt-4 text-[1.02rem] text-cloud">{title}</h3>
              <p className="mt-2 text-[0.88rem] leading-relaxed text-mist">{text}</p>
            </RevealItem>
          ))}
        </Reveal>

        {/* Solar teaser */}
        <Reveal className="mt-5">
          <div className="relative overflow-hidden rounded-3xl border border-white/10">
            <div aria-hidden className="absolute inset-0">
              <Image
                src={media.solar}
                alt=""
                fill
                quality={70}
                sizes="100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-abyss via-abyss/85 to-abyss/40" />
            </div>
            <div className="relative max-w-2xl p-6 sm:p-9 lg:p-11">
              <p className="eyebrow">Наступний крок, коли захочеться</p>
              <h3 className="font-heading mt-3 text-[clamp(1.3rem,3.2vw,1.9rem)] leading-tight text-cloud">
                Той самий комплект стає сонячною станцією
              </h3>
              <p className="mt-4 text-[0.95rem] leading-relaxed text-mist">
                Контролер MPPT {inverter.mppt.currentA} А вже вбудований в інвертор — це та частина
                сонячної системи, яку зазвичай купують окремо й дорого. Коли з’явиться нагода
                поставити панелі, система прийме до {inverter.mppt.maxPvW} Вт масиву й почне
                заряджати банк від сонця, а не від мережі.
              </p>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
