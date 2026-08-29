'use client';

import { useEffect, useMemo, useRef } from 'react';
import { animate, useInView, useReducedMotion } from 'motion/react';

/**
 * Number that counts up once, when it scrolls into view. Written straight to
 * textContent rather than through React state so a 1.4 s count-up doesn't
 * re-render the surrounding section sixty times a second.
 */
export function Counter({
  to,
  from = 0,
  decimals = 0,
  duration = 1.4,
  suffix = '',
  prefix = '',
  className,
}: {
  to: number;
  from?: number;
  decimals?: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduce = useReducedMotion();

  // One cached formatter, not toLocaleString per frame: each call to
  // toLocaleString constructs a fresh Intl.NumberFormat, and onUpdate runs
  // it 60x/s per visible counter — exactly while the section scrolls in.
  const nf = useMemo(
    () =>
      new Intl.NumberFormat('uk-UA', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }),
    [decimals],
  );
  const format = (n: number) => `${prefix}${nf.format(n)}${suffix}`;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!inView) {
      el.textContent = format(from);
      return;
    }
    if (reduce) {
      el.textContent = format(to);
      return;
    }
    const controls = animate(from, to, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        el.textContent = format(v);
      },
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, to, from, reduce]);

  return (
    <span ref={ref} className={className}>
      {format(from)}
    </span>
  );
}
