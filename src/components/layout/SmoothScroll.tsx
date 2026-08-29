'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';

/**
 * Momentum smooth-scrolling via Lenis, mounted once at the root. Skipped
 * entirely under prefers-reduced-motion.
 *
 * The live instance is exposed via `lenisRef` so overlays can PAUSE it: Lenis
 * drives the page from global wheel events, so `overflow: hidden` alone does
 * not stop the page scrolling behind an open dialog.
 */
export const lenisRef: { current: Lenis | null } = { current: null };

/**
 * Ref-counted page-scroll lock.
 *
 * Three separate overlays can be open at once (the lead dialog, the mobile
 * drawer, the appliance catalogue). Each used to call `lenis.start()` and clear
 * `overflow` on its own teardown, so closing ANY of them released the lock for
 * ALL of them and the page scrolled behind whatever was still open. Counting
 * the holders fixes that: scrolling resumes only when the last one lets go.
 *
 * `overflow: hidden` is applied alongside stopping Lenis rather than instead of
 * it, because under prefers-reduced-motion SmoothScroll never constructs Lenis
 * at all and `lenisRef.current?.stop()` is a silent no-op.
 */
let scrollLocks = 0;
let restoreOverflow = '';

export function lockScroll() {
  if (scrollLocks === 0) {
    restoreOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    lenisRef.current?.stop();
  }
  scrollLocks += 1;
}

export function unlockScroll() {
  scrollLocks = Math.max(0, scrollLocks - 1);
  if (scrollLocks === 0) {
    document.documentElement.style.overflow = restoreOverflow;
    lenisRef.current?.start();
  }
}

export function SmoothScroll() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
    });
    lenisRef.current = lenis;

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    // Ease same-page anchor clicks and keep the sticky header clear.
    const onClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('a');
      const href = target?.getAttribute('href');
      if (!href || !href.startsWith('#') || href === '#') return;
      const el = document.querySelector(href);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el as HTMLElement, { offset: -88 });
      history.replaceState(null, '', href);
    };
    document.addEventListener('click', onClick);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('click', onClick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return null;
}
