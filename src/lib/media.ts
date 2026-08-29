/**
 * Centralised media references.
 *
 * Photography: Unsplash (free licence), SELF-HOSTED — `npm run images` mirrors
 * every referenced photo into public/images/u so next/image optimises from
 * local disk instead of round-tripping to the Unsplash CDN. Files are keyed by
 * the Unsplash short id; after adding a U() call, add the same id to
 * scripts/download-images.mjs and re-run the script.
 *
 * Product shots: manufacturer studio photography (VOLT Polska, Humsienk) with
 * the white studio background flood-filled to transparent — see scripts/cutout.mjs.
 */
export const U = (id: string, w = 1400) => `/images/u/${id}-${w}.jpg`;

export const media = {
  /** Hero — a single lit window in an otherwise dark block. The whole offer
   *  in one frame, so it earns the LCP slot. One entry, not a desktop/mobile
   *  pair: it is the same photograph either way, and next/image already picks
   *  a narrower rendition from `sizes` — while a second `display:none` <img>
   *  would have been downloaded on every desktop visit for nothing. */
  hero: U('SkCMBjCspDU', 1920),

  /** The problem: a lantern on the windowsill. */
  blackout: U('lrj7xeJlcb4', 1400),
  /** The result: a warm lamp burning in a dark room. */
  warmRoom: U('2YNeDr89feQ', 1400),
  /** MPPT block — the kit accepts panels later. */
  solar: U('9CalgkSRZb8', 1600),
  /** Installation block. */
  install: U('GXLPLG3_Vf4', 1400),
  wiring: U('_2AlIm-F6pw', 1400),
  /** Night desk — the work-from-home argument. */
  desk: U('odyglVvZv18', 1400),
  /** Final CTA — a wall of lit windows. */
  cityNight: U('31dwLQWz0Ec', 1920),

  inverterFront: '/images/inverter-front.png',
  inverterAngle: '/images/inverter-angle.png',
  battery: '/images/battery.png',
} as const;
