'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check, Plus, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ApplianceIcon } from '@/components/ui/ApplianceIcon';
import { lockScroll, unlockScroll } from '@/components/layout/SmoothScroll';
import { useFocusTrap, useVisualViewportHeight } from '@/lib/use-focus-trap';
import { openLeadModal } from '@/components/lead/LeadModal';
import { GLOBAL_LEAD } from '@/lib/lead-forms';
import { catalogAppliances, groups, matchesQuery, type Appliance } from '@/lib/appliances';
import { inverter } from '@/lib/kit';
import type { Selection } from '@/lib/calc';

/**
 * The appliance catalogue — a bottom sheet on phones, a centred dialog from sm.
 *
 * Twelve appliances live permanently in the picker grid; the other sixteen live
 * here. The sheet stays OPEN as items are added, because the realistic gesture
 * is "add the three things I own", not "add one, reopen, add one".
 *
 * The rows carry each appliance's usage note BEFORE it is added, which is more
 * honest than the old grid, where you had to select a tile to discover how the
 * appliance was modelled.
 */

const NEVER_CHANGES = () => () => {};
const useMounted = () => useSyncExternalStore(NEVER_CHANGES, () => true, () => false);

export function ApplianceCatalog({
  open,
  onClose,
  selection,
  onToggle,
}: {
  open: boolean;
  onClose: () => void;
  selection: Selection;
  onToggle: (a: Appliance) => void;
}) {
  const reduce = useReducedMotion();
  const mounted = useMounted();
  const [query, setQuery] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const vvHeight = useVisualViewportHeight(open);

  // Every dismissal path funnels through here so the next visit always opens
  // on the full list rather than on a stale filter.
  const close = useCallback(() => {
    setQuery('');
    onClose();
  }, [onClose]);

  useFocusTrap(panelRef, open, close);

  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    lockScroll();

    // Never autofocus the field on touch: the keyboard would cover the list
    // the visitor came here to read.
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const t = coarse
      ? undefined
      : setTimeout(() => panelRef.current?.querySelector<HTMLInputElement>('input')?.focus(), 80);

    return () => {
      if (t) clearTimeout(t);
      unlockScroll();
      restoreFocusRef.current?.focus?.();
    };
  }, [open]);

  /** Groups keep their order; empty ones drop out while searching. */
  const sections = useMemo(() => {
    const hits = catalogAppliances.filter((a) => matchesQuery(a, query));
    return groups
      .map((g) => ({ group: g, items: hits.filter((a) => a.group === g.id) }))
      .filter((s) => s.items.length > 0);
  }, [query]);

  const addedCount = useMemo(
    () => catalogAppliances.filter((a) => selection[a.id]?.qty).length,
    [selection],
  );

  const onSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Enter drops the keyboard and keeps the filtered list — a form submit here
    // would be meaningless and on iOS it would also scroll the sheet.
    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="catalog"
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="fixed inset-0 z-100 flex items-end justify-center sm:items-center sm:p-6"
        >
          <motion.button
            type="button"
            aria-label="Закрити каталог"
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
            transition={{ duration: 0.2 }}
            onClick={close}
            className="absolute inset-0 cursor-default touch-none bg-abyss/80 backdrop-blur-sm"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="catalog-title"
            variants={{
              hidden: { opacity: 0, y: reduce ? 0 : 40 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={
              reduce ? { duration: 0.12 } : { type: 'spring', stiffness: 260, damping: 30 }
            }
            // svh keeps mobile browser chrome honest; the visualViewport value
            // overrides it while the keyboard is up, which svh cannot see.
            style={vvHeight ? { maxHeight: Math.round(vvHeight * 0.92) } : undefined}
            className="relative flex max-h-[92svh] w-full flex-col overflow-hidden rounded-t-3xl border border-ember-400/25 bg-ink-950 shadow-[0_30px_90px_rgba(0,0,0,0.8)] sm:max-h-[80svh] sm:max-w-lg sm:rounded-3xl"
          >
            {/* Header — sticky by virtue of being outside the scroller, so the
                search field stays above the keyboard. */}
            <div className="shrink-0 border-b border-white/8 px-4 pb-3 pt-3 sm:px-6 sm:pb-4 sm:pt-5">
              <span
                aria-hidden
                className="mx-auto mb-3 block h-1 w-10 rounded-full bg-white/20 sm:hidden"
              />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">Каталог</p>
                  <h2 id="catalog-title" className="font-heading mt-1.5 text-lg text-cloud">
                    Додати прилад
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Закрити каталог"
                  className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full border border-white/12 text-mist transition-colors hover:border-ember-400/50 hover:text-frost"
                >
                  <X aria-hidden className="size-5" />
                </button>
              </div>

              <div className="relative mt-3">
                <Search
                  aria-hidden
                  className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-dim"
                />
                <input
                  type="search"
                  inputMode="search"
                  enterKeyHint="done"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onSearchKeyDown}
                  aria-label="Пошук приладу"
                  placeholder="Знайти: пилосос, кондиціонер, ПК…"
                  className="min-h-11 w-full rounded-xl border border-white/12 bg-white/[0.03] pl-10 pr-3 text-[0.95rem] text-frost transition-colors placeholder:text-dim focus:border-ember-400/60 focus:outline-none"
                />
              </div>
            </div>

            {/* min-h-0 is load-bearing: without it this flex child refuses to
                shrink below its content and nothing scrolls. */}
            <div
              data-lenis-prevent
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 sm:px-6"
            >
              {sections.length === 0 ? (
                <div className="flex flex-col items-start gap-3 py-10">
                  <p className="font-heading text-base text-cloud">Нічого не знайшли</p>
                  <p className="text-sm leading-relaxed text-mist">
                    Спробуйте іншу назву — або напишіть нам, порахуємо вручну.
                  </p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      className="inline-flex min-h-11 cursor-pointer items-center rounded-xl border border-white/12 px-4 text-sm text-frost transition-colors hover:border-white/30"
                    >
                      Скинути пошук
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        close();
                        openLeadModal({
                          config: GLOBAL_LEAD,
                          source: { id: 'catalog-empty', button: 'Написати нам' },
                        });
                      }}
                      className="inline-flex min-h-11 cursor-pointer items-center rounded-xl border border-ember-400/40 px-4 text-sm font-semibold text-ember-200 transition-colors hover:bg-ember-400/10"
                    >
                      Написати нам
                    </button>
                  </div>
                </div>
              ) : (
                sections.map(({ group, items }) => (
                  <section key={group.id} className="mb-5 last:mb-1">
                    <h3 className="sticky top-0 z-10 -mx-1 bg-ink-950/95 px-1 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ash backdrop-blur-sm">
                      {group.label}
                    </h3>
                    <ul className="mt-1 space-y-1.5">
                      {items.map((a) => (
                        <CatalogRow
                          key={a.id}
                          appliance={a}
                          added={Boolean(selection[a.id]?.qty)}
                          onToggle={() => onToggle(a)}
                        />
                      ))}
                    </ul>
                  </section>
                ))
              )}
            </div>

            <div className="shrink-0 border-t border-white/8 px-4 pb-[max(0.85rem,env(safe-area-inset-bottom))] pt-3 sm:px-6 sm:pb-5">
              <button
                type="button"
                onClick={close}
                className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-ember-300 to-ember-500 px-6 font-bold text-abyss transition-opacity hover:opacity-95"
              >
                Готово
                {addedCount > 0 && (
                  <span className="tnum rounded-full bg-abyss/20 px-2 py-0.5 text-[0.72rem]">
                    додано {addedCount}
                  </span>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/**
 * One catalogue row. Same stretched-button recipe the picker tiles use: the
 * toggle is an absolutely-positioned button UNDER pointer-events-none content,
 * so the row is fully clickable without nesting a button inside a button.
 */
function CatalogRow({
  appliance,
  added,
  onToggle,
}: {
  appliance: Appliance;
  added: boolean;
  onToggle: () => void;
}) {
  const heavy = (appliance.peakW ?? appliance.watts) > inverter.powerW;

  return (
    <li>
      <div
        className={cn(
          'group relative rounded-xl border transition-colors',
          added
            ? 'border-ember-400/55 bg-ember-400/8'
            : 'border-white/8 bg-white/[0.02] hover:border-white/20',
        )}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={added}
          className="absolute inset-0 z-0 cursor-pointer rounded-xl"
        >
          <span className="sr-only">
            {added ? `Прибрати: ${appliance.name}` : `Додати: ${appliance.name}`}
          </span>
        </button>

        <div className="pointer-events-none relative z-10 flex items-center gap-3 p-2.5">
          <span
            className={cn(
              'grid size-10 shrink-0 place-items-center rounded-lg border',
              added
                ? 'border-ember-400/40 bg-ember-400/15 text-ember-300'
                : 'border-white/8 bg-white/[0.03] text-mist',
            )}
          >
            <ApplianceIcon id={appliance.id} className="size-5" />
          </span>

          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-[0.88rem] font-semibold text-frost">{appliance.name}</span>
              <span className="tnum text-[0.7rem] text-dim">
                {appliance.peakW ?? appliance.watts} Вт
              </span>
              {heavy && (
                <span className="rounded border border-alarm-400/35 bg-alarm-500/10 px-1.5 text-[0.6rem] font-semibold text-alarm-300">
                  &gt; {inverter.powerW} Вт
                </span>
              )}
            </span>
            <span className="mt-0.5 block text-[0.72rem] leading-snug text-ash">
              {appliance.note}
            </span>
          </span>

          <span
            className={cn(
              'grid size-9 shrink-0 place-items-center rounded-lg border transition-colors',
              added
                ? 'border-ember-400/50 bg-ember-400 text-abyss'
                : 'border-white/14 text-mist group-hover:border-ember-400/50 group-hover:text-frost',
            )}
          >
            {added ? (
              <Check aria-hidden className="size-4" strokeWidth={3} />
            ) : (
              <Plus aria-hidden className="size-4" />
            )}
          </span>
        </div>
      </div>
    </li>
  );
}
