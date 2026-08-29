'use client';

import { motion, useReducedMotion } from 'motion/react';

/**
 * Animated hero backdrop: a bus-bar schematic with current running through it.
 *
 * PERFORMANCE NOTES — this block used to drop frames on desktop, so the two
 * expensive things it does are deliberately constrained:
 *
 * 1. The glows are plain radial gradients, NOT `filter: blur()`. Skia expands a
 *    filter region by 3σ, so `blur(64px)` on a 38rem circle meant an ~992²
 *    offscreen render pass per glow per frame — for a gradient that is already
 *    smooth. Widening the box and softening the colour stops gives the same
 *    picture with zero filter work, which also makes the `scale` keyframes pure
 *    compositor transforms.
 *
 * 2. `stroke-dashoffset` is NOT compositable in Chrome — it repaints. The
 *    animation is therefore quantised with `steps()`, which cuts repaints from
 *    60/s to ~7/s; at 1.5 px stroke width the advance still reads as continuous
 *    flow. The <svg> also carries its own `will-change`, so those repaints
 *    dirty a dedicated layer instead of the shared parallax plane.
 *
 * Under prefers-reduced-motion the dashes and glows hold still; the lines
 * themselves stay, so the composition never collapses. The explicit `reduce`
 * guards matter: the global reduced-motion rule only shortens animations to
 * 0.01ms, which SNAPS an element to its final keyframe rather than stopping it
 * — and pulse-ring's final keyframe is `opacity: 0`.
 */

/** One dash period is 32 user units; 16 steps ≈ 2.7 px of travel per repaint. */
const FLOW = 'flow 2.4s steps(16) infinite';

const RAILS = [
  { d: 'M-40 210 H360 L440 290 H900 L980 210 H1480', delay: 0 },
  { d: 'M-40 430 H240 L320 350 H700 L780 430 H1180 L1260 500 H1480', delay: -0.9 },
  { d: 'M-40 660 H420 L500 590 H860 L940 660 H1480', delay: -1.8 },
  { d: 'M-40 830 H620 L700 760 H1120 L1200 830 H1480', delay: -2.6 },
];

const NODES = [
  { cx: 440, cy: 290, delay: 0 },
  { cx: 900, cy: 290, delay: 0.7 },
  { cx: 320, cy: 350, delay: 1.4 },
  { cx: 780, cy: 430, delay: 0.35 },
  { cx: 500, cy: 590, delay: 1.1 },
  { cx: 1200, cy: 830, delay: 1.9 },
];

export function HeroBackdrop() {
  const reduce = useReducedMotion();

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Breathing ember glows — the "power is on somewhere" light. */}
      <motion.div
        className="absolute top-[-1%] -left-64 h-[50rem] w-[50rem] rounded-full opacity-70"
        style={{
          background:
            'radial-gradient(circle, rgba(246,133,14,0.20) 0%, rgba(246,133,14,0.09) 30%, rgba(246,133,14,0.03) 55%, transparent 78%)',
          willChange: 'transform, opacity',
        }}
        animate={reduce ? undefined : { scale: [1, 1.12, 1], opacity: [0.55, 0.8, 0.55] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-[30%] -right-52 h-[42rem] w-[42rem] rounded-full opacity-60"
        style={{
          background:
            'radial-gradient(circle, rgba(255,165,36,0.16) 0%, rgba(255,165,36,0.07) 32%, rgba(255,165,36,0.02) 58%, transparent 80%)',
          willChange: 'transform, opacity',
        }}
        animate={reduce ? undefined : { scale: [1.08, 1, 1.08], opacity: [0.45, 0.7, 0.45] }}
        transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[-18%] left-[29%] h-[36rem] w-[36rem] rounded-full opacity-50"
        style={{
          background:
            'radial-gradient(circle, rgba(53,227,155,0.12) 0%, rgba(53,227,155,0.05) 34%, transparent 76%)',
          willChange: 'transform',
        }}
        animate={reduce ? undefined : { scale: [1, 1.18, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Bus-bar schematic */}
      {/* preserveAspectRatio="none" instead of "slice": slice scaled the 1440
          viewBox up to ~1740 px on a 1270 px box, so a third of every repaint
          was overscan nobody sees. The rails are abstract, so stretching them
          is invisible. */}
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        style={{ willChange: 'transform' }}
      >
        <defs>
          <linearGradient id="hero-rail" x1="0" y1="0" x2="1440" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FFA524" stopOpacity="0" />
            <stop offset="0.25" stopColor="#FFA524" stopOpacity="0.5" />
            <stop offset="0.75" stopColor="#F6850E" stopOpacity="0.45" />
            <stop offset="1" stopColor="#F6850E" stopOpacity="0" />
          </linearGradient>
        </defs>

        {RAILS.map((rail) => (
          <g key={rail.d}>
            <path
              d={rail.d}
              fill="none"
              stroke="#ffffff"
              strokeOpacity="0.055"
              strokeWidth="1.25"
              strokeLinejoin="round"
            />
            <path
              d={rail.d}
              fill="none"
              stroke="url(#hero-rail)"
              strokeWidth="1.5"
              strokeLinejoin="round"
              strokeDasharray="6 26"
              style={reduce ? undefined : { animation: FLOW, animationDelay: `${rail.delay}s` }}
            />
          </g>
        ))}

        {NODES.map((n) => (
          <g key={`${n.cx}-${n.cy}`}>
            <circle cx={n.cx} cy={n.cy} r="3" fill="#FFC46B" fillOpacity="0.85" />
            <circle
              cx={n.cx}
              cy={n.cy}
              r="3"
              fill="none"
              stroke="#FFA524"
              strokeOpacity="0.55"
              strokeWidth="1"
              style={
                reduce
                  ? undefined
                  : {
                      transformOrigin: `${n.cx}px ${n.cy}px`,
                      animation: 'pulse-ring 2.6s cubic-bezier(0.22,1,0.36,1) infinite',
                      animationDelay: `${n.delay}s`,
                    }
              }
            />
          </g>
        ))}
      </svg>
    </div>
  );
}
