'use client';

import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { openLeadModal } from '@/components/lead/LeadModal';
import { GLOBAL_LEAD } from '@/lib/lead-forms';
import { faq } from '@/lib/faq';

/**
 * Accordion. One panel open at a time, animated on height so the page doesn't
 * jump; the button carries aria-expanded and controls the region by id, so it
 * works from the keyboard and reads correctly in a screen reader.
 */
export function FAQ() {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="pytannya" className="relative scroll-mt-24 py-20 sm:py-24 lg:py-28">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
          <Reveal as="header" className="lg:sticky lg:top-28 lg:self-start">
            <p className="flex items-center gap-3">
              <span className="tnum text-xs text-ember-600">08</span>
              <span aria-hidden className="h-px w-8 bg-ember-500/50" />
              <span className="eyebrow">Питання</span>
            </p>
            <h2 className="font-heading mt-5 text-[clamp(1.75rem,4.6vw,2.75rem)] leading-[1.08] text-cloud">
              Те, що питають{' '}
              <span className="text-ember-sheen">перед покупкою</span>
            </h2>
            <p className="mt-5 text-[0.98rem] leading-relaxed text-mist">
              Якщо вашого питання тут немає — просто спитайте. Відповідаємо навіть тоді, коли
              відповідь звучить як «цей комплект вам не підійде».
            </p>
            <button
              type="button"
              onClick={() =>
                openLeadModal({
                  config: GLOBAL_LEAD,
                  source: { id: 'faq', button: 'Поставити своє питання' },
                })
              }
              className="mt-6 inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border border-ember-400/40 px-6 font-semibold text-frost transition-colors hover:border-ember-300 hover:bg-ember-400/10"
            >
              Поставити своє питання
            </button>
          </Reveal>

          <Reveal>
            <ul className="divide-y divide-white/8 border-y border-white/8">
              {faq.map((item, i) => {
                const isOpen = open === i;
                return (
                  <li key={item.q}>
                    <h3>
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={`faq-panel-${i}`}
                        id={`faq-trigger-${i}`}
                        onClick={() => setOpen(isOpen ? null : i)}
                        className="flex w-full cursor-pointer items-start justify-between gap-4 py-5 text-left"
                      >
                        <span
                          className={cn(
                            'font-heading text-[0.98rem] leading-snug transition-colors sm:text-[1.05rem]',
                            isOpen ? 'text-ember-200' : 'text-frost',
                          )}
                        >
                          {item.q}
                        </span>
                        <span
                          className={cn(
                            'grid size-8 shrink-0 place-items-center rounded-lg border transition-all duration-300',
                            isOpen
                              ? 'rotate-45 border-ember-400/50 bg-ember-400/10 text-ember-300'
                              : 'border-white/12 text-mist',
                          )}
                        >
                          <Plus aria-hidden className="size-4" />
                        </span>
                      </button>
                    </h3>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key="panel"
                          id={`faq-panel-${i}`}
                          role="region"
                          aria-labelledby={`faq-trigger-${i}`}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={
                            reduce ? { duration: 0 } : { duration: 0.32, ease: [0.22, 1, 0.36, 1] }
                          }
                          className="overflow-hidden"
                        >
                          <p className="pb-6 pr-12 text-[0.9rem] leading-relaxed text-mist">
                            {item.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
