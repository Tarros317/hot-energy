'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Menu, Phone, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/Logo';
import { openLeadModal } from '@/components/lead/LeadModal';
import { lockScroll, unlockScroll } from '@/components/layout/SmoothScroll';
import { nav, site } from '@/lib/site';
import { LEAD_FORMS } from '@/lib/lead-forms';

/**
 * Floating capsule header. Logo left, section jump-links centre, conversion
 * CTA right. The active link is derived from scroll position rather than the
 * URL hash, so the indicator keeps up when the visitor scrolls by hand.
 */
export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState<string>('');
  const reduce = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Section spy. rootMargin pins the "active" line just under the header so a
  // section counts as current the moment its heading clears the capsule.
  useEffect(() => {
    const sections = nav
      .map(({ href }) => document.querySelector<HTMLElement>(href))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!sections.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible?.target.id) setActive(`#${visible.target.id}`);
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: 0 },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  // Ref-counted so closing the drawer cannot release a lock the lead dialog
  // or the appliance catalogue is still holding.
  useEffect(() => {
    if (!menuOpen) return;
    lockScroll();
    return unlockScroll;
  }, [menuOpen]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-90 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 sm:pt-[max(1rem,env(safe-area-inset-top))]">
        <motion.div
          initial={{ y: -22, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          // The blur radius is CONSTANT and is never transitioned. Animating
          // backdrop-filter re-derives the Gaussian at a new sigma on every
          // frame of the 500 ms window, and that window opens at 24 px of
          // scroll — exactly when the hero is busiest. Crossfading the tint
          // alone is indistinguishable over a near-black bar.
          className={cn(
            'mx-auto flex w-full max-w-7xl items-center justify-between gap-4 rounded-2xl border px-3 py-2.5 backdrop-blur-md transition-[background-color,border-color] duration-500 sm:px-4',
            scrolled || menuOpen ? 'border-white/10 bg-abyss/85' : 'border-white/6 bg-abyss/25',
          )}
        >
          <a href="#top" aria-label="Hot Energy — на початок" className="flex shrink-0 items-center py-1.5 pl-1">
            <Logo markClassName="h-8 w-8 sm:h-9 sm:w-9" wordClassName="text-sm sm:text-base" />
          </a>

          <nav aria-label="Розділи сторінки" className="hidden items-center gap-1 lg:flex">
            {nav.map(({ label, href }) => {
              const isActive = active === href;
              return (
                <a
                  key={href}
                  href={href}
                  aria-current={isActive ? 'true' : undefined}
                  className={cn(
                    'relative rounded-lg px-3 py-2 text-sm transition-colors',
                    isActive ? 'text-cloud' : 'text-mist hover:text-frost',
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      className="absolute inset-0 -z-10 rounded-lg border border-ember-400/25 bg-ember-400/10"
                    />
                  )}
                  {label}
                </a>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href={site.phone.href}
              className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm text-frost transition-colors hover:text-ember-300 xl:flex"
            >
              <Phone aria-hidden className="size-4 text-ember-400" />
              <span className="tnum">{site.phone.display}</span>
            </a>

            <button
              type="button"
              onClick={() =>
                openLeadModal({
                  config: LEAD_FORMS.hero,
                  source: { id: 'header', button: 'Залишити заявку' },
                })
              }
              className="hidden min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-b from-ember-300 to-ember-500 px-5 text-sm font-semibold text-abyss shadow-[0_8px_24px_-10px_rgba(246,133,14,0.8)] transition-opacity hover:opacity-95 sm:inline-flex"
            >
              Залишити заявку
            </button>

            <button
              type="button"
              aria-label={menuOpen ? 'Закрити меню' : 'Відкрити меню'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="grid size-11 cursor-pointer place-items-center rounded-xl border border-white/12 text-frost transition-colors hover:border-white/30 lg:hidden"
            >
              {menuOpen ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
            </button>
          </div>
        </motion.div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="drawer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            data-lenis-prevent
            className="fixed inset-0 z-80 overflow-y-auto overscroll-contain bg-abyss/97 backdrop-blur-xl lg:hidden"
          >
            <motion.nav
              aria-label="Мобільна навігація"
              className="flex min-h-full flex-col justify-between px-6 pt-[max(6.5rem,calc(env(safe-area-inset-top)+5.5rem))] pb-[max(2.5rem,calc(env(safe-area-inset-bottom)+2rem))]"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={{
                visible: { transition: { staggerChildren: reduce ? 0 : 0.05 } },
                hidden: {},
              }}
            >
              <ul className="space-y-1">
                {nav.map(({ label, href }) => (
                  <motion.li
                    key={href}
                    variants={{
                      hidden: { opacity: 0, y: reduce ? 0 : 16 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
                      },
                    }}
                  >
                    <a
                      href={href}
                      onClick={() => setMenuOpen(false)}
                      className="font-heading block border-b border-white/6 py-3.5 text-2xl text-cloud"
                    >
                      {label}
                    </a>
                  </motion.li>
                ))}
              </ul>

              <motion.div
                className="mt-8 space-y-3"
                variants={{
                  hidden: { opacity: 0, y: reduce ? 0 : 16 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
                  },
                }}
              >
                <a
                  href={site.phone.href}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/12 text-lg text-frost"
                >
                  <Phone aria-hidden className="size-5 text-ember-400" />
                  <span className="tnum">{site.phone.display}</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    openLeadModal({
                      config: LEAD_FORMS.hero,
                      source: { id: 'header-mobile', button: 'Залишити заявку' },
                    });
                  }}
                  className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-ember-300 to-ember-500 font-semibold text-abyss"
                >
                  Залишити заявку
                </button>
              </motion.div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent phone action bar — the thumb never has to hunt for a CTA. */}
      <div className="fixed inset-x-0 bottom-0 z-70 grid grid-cols-2 gap-px border-t border-white/8 bg-abyss/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl sm:hidden">
        <a
          href={site.phone.href}
          className="flex items-center justify-center gap-2 py-3.5 text-sm font-semibold text-frost"
        >
          <Phone aria-hidden className="size-4 text-ember-400" />
          Подзвонити
        </a>
        <button
          type="button"
          onClick={() =>
            openLeadModal({
              config: LEAD_FORMS.hero,
              source: { id: 'mobile-bar', button: 'Заявка' },
            })
          }
          className="flex cursor-pointer items-center justify-center gap-2 bg-gradient-to-b from-ember-300 to-ember-500 py-3.5 text-sm font-bold text-abyss"
        >
          Заявка
          <ArrowRight aria-hidden className="size-4" />
        </button>
      </div>
    </>
  );
}
