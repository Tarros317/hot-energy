import { cn } from '@/lib/utils';

/**
 * Hot Energy mark — a battery module with a bolt cut out of it, in heated
 * metal. The two halves of the name are the two halves of the product: a cell
 * that stores («energy») and a discharge that is hot to the touch («hot»).
 *
 * Drawn at 40×40 so it stays legible down to a 16 px favicon.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn('h-9 w-9', className)} aria-hidden focusable="false">
      <defs>
        <linearGradient id="he-ember" x1="6" y1="4" x2="34" y2="37" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFD79A" />
          <stop offset="0.45" stopColor="#FFA524" />
          <stop offset="1" stopColor="#E1710A" />
        </linearGradient>
      </defs>
      {/* terminal */}
      <rect x="15.5" y="3" width="9" height="4.6" rx="2.3" fill="url(#he-ember)" />
      {/* cell body */}
      <rect
        x="4.6"
        y="7.8"
        width="30.8"
        height="29.2"
        rx="8.4"
        fill="none"
        stroke="url(#he-ember)"
        strokeWidth="2.6"
      />
      {/* charge bolt */}
      <path
        d="M23.4 12.6 14.4 23.9h4.8l-2.2 9.3 9-11.4h-4.9z"
        fill="url(#he-ember)"
      />
    </svg>
  );
}

/** Mark plus wordmark, as used in the header and the footer. */
export function Logo({
  className,
  markClassName,
  wordClassName,
}: {
  className?: string;
  markClassName?: string;
  wordClassName?: string;
}) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <LogoMark className={markClassName} />
      <span
        className={cn(
          'font-display text-[1.05rem] leading-none tracking-tight whitespace-nowrap',
          wordClassName,
        )}
      >
        <span className="text-cloud">HOT</span>
        <span className="text-ember-400"> ENERGY</span>
      </span>
    </span>
  );
}
