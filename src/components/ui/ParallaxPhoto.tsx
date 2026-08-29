'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { cn } from '@/lib/utils';

/**
 * Full-bleed photograph with a scroll-driven parallax drift. The image is
 * rendered taller than its frame and slides as the section crosses the
 * viewport. Transform-only, driven straight off the scroll signal: Lenis
 * already low-passes wheel input, and a second spring on top of it reads as
 * lag, not smoothness — while costing a settling animation after every
 * scroll event. Flattened under reduced-motion.
 */
export function ParallaxPhoto({
  src,
  alt,
  className,
  sizes = '100vw',
  priority,
  amount = 12,
  quality = 75,
  overlay = 'default',
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** Parallax travel as a percentage of the frame height. */
  amount?: number;
  quality?: number;
  overlay?: 'default' | 'heavy' | 'none';
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    reduce ? ['0%', '0%'] : [`-${amount}%`, `${amount}%`],
  );

  return (
    <div ref={ref} className={cn('relative overflow-hidden bg-ink-900', className)}>
      <motion.div
        style={{ y, willChange: 'transform' }}
        className="absolute inset-x-0 -top-[15%] h-[130%]"
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          quality={quality}
          className="object-cover"
        />
      </motion.div>
      {overlay !== 'none' && (
        <div
          className={cn(
            'absolute inset-0',
            overlay === 'heavy'
              ? 'bg-gradient-to-t from-abyss via-abyss/70 to-abyss/45'
              : 'bg-gradient-to-t from-abyss/92 via-abyss/25 to-abyss/45',
          )}
        />
      )}
    </div>
  );
}
