'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, type Variants } from 'motion/react';
import { cn } from '@/lib/utils';

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Scroll-reveal wrapper. Checks position on mount and shows immediately if the
 * element is already in view, so above-the-fold content is never left hidden
 * (the classic "hero is blank until you scroll" bug on fast connections).
 */
function useRevealed<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || shown) return;

    const r = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    if (r.top < vh * 0.92 && r.bottom > 0) {
      setShown(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shown]);

  return { ref, shown };
}

export function Reveal({
  children,
  className,
  delay = 0,
  stagger = 0,
  as = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /** Seconds between children; 0 animates the block as one unit. */
  stagger?: number;
  as?: 'div' | 'section' | 'ul' | 'span' | 'header';
}) {
  const reduce = useReducedMotion();
  const { ref, shown } = useRevealed<HTMLDivElement>();
  const Tag = motion[as];

  const parent: Variants = {
    hidden: {},
    visible: {
      transition: stagger ? { staggerChildren: stagger, delayChildren: delay } : undefined,
    },
  };

  const block: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 26 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE, delay } },
  };

  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      className={cn(className)}
      initial="hidden"
      animate={shown ? 'visible' : 'hidden'}
      variants={stagger ? parent : block}
    >
      {children}
    </Tag>
  );
}

/** Child of a staggered Reveal — inherits the parent's animation state. */
export function RevealItem({
  children,
  className,
  as = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'li' | 'span' | 'article';
}) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  return (
    <Tag
      className={cn(className)}
      variants={{
        hidden: { opacity: 0, y: reduce ? 0 : 22 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
      }}
    >
      {children}
    </Tag>
  );
}
