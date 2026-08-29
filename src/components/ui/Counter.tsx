'use client';

import { useEffect, useRef } from 'react';
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

  const format = (n: number) =>
    `${prefix}${n.toLocaleString('uk-UA', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}${suffix}`;

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
