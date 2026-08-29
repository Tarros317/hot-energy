'use client';

import { useReducedMotion } from 'motion/react';
import { Container } from '@/components/ui/Container';
import { Reveal, RevealItem } from '@/components/ui/Reveal';
import { ParallaxPhoto } from '@/components/ui/ParallaxPhoto';
import { ApplianceIcon } from '@/components/ui/ApplianceIcon';
import { media } from '@/lib/media';

/**
 * The setup block. No statistics and no fear-mongering — just the list of
 * things that stop when the meter goes quiet, which is the part people
 * underestimate until the second evening in a row.
 */

const LOSSES = [
  { id: 'router', label: 'Інтернет і зв’язок', text: 'Роутер, ONU, домашня АТС — зникають першими.' },
  { id: 'boiler', label: 'Опалення', text: 'Газовий котел без живлення не запускає ні пальник, ні насос.' },
  { id: 'wellPump', label: 'Вода', text: 'У будинку зі свердловиною разом зі світлом зникає й тиск у крані.' },
  { id: 'fridge', label: 'Холодильник', text: 'Дві-три години — терпимо. Восьма година — це вже вибір, що викидати.' },
  { id: 'pc', label: 'Робота', text: 'Дзвінок обривається на середині речення, незбережений файл — теж.' },
  { id: 'security', label: 'Безпека', text: 'Камери, сигналізація й домофон вимикаються разом з усім будинком.' },
];

export function Problem() {
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden py-20 sm:py-24">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          <Reveal className="order-2 lg:order-1">
            <ParallaxPhoto
              src={media.blackout}
              alt="Ліхтар на підвіконні у темній кімнаті під час відключення світла"
              className="h-72 w-full rounded-3xl sm:h-96"
              sizes="(max-width: 1024px) 100vw, 40vw"
              amount={10}
              overlay="none"
            />
          </Reveal>

          <div className="order-1 lg:order-2">
            <Reveal as="header">
              <p className="eyebrow">Вечір без світла</p>
              <h2 className="font-heading mt-4 text-[clamp(1.6rem,4.2vw,2.6rem)] leading-[1.1] text-cloud">
                Ліхтарик вирішує питання світла.{' '}
                <span className="text-mist">Решту — ні</span>
              </h2>
            </Reveal>

            <Reveal className="mt-8 grid gap-x-8 gap-y-5 sm:grid-cols-2" stagger={reduce ? 0 : 0.06}>
              {LOSSES.map((l) => (
                <RevealItem key={l.id} className="flex gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-white/8 bg-white/[0.02] text-ash">
                    <ApplianceIcon id={l.id} className="size-4.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[0.9rem] font-semibold text-frost">{l.label}</p>
                    <p className="mt-1 text-[0.82rem] leading-relaxed text-ash">{l.text}</p>
                  </div>
                </RevealItem>
              ))}
            </Reveal>

            <Reveal className="mt-8">
              <p className="border-l-2 border-ember-500/60 pl-4 text-[0.95rem] leading-relaxed text-mist">
                Комплект безперебійного живлення не робить нічого героїчного. Він просто не дає
                будинку вимкнутися — і саме тому про нього забуваєш уже за тиждень після
                встановлення.
              </p>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
