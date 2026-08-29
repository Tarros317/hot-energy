/**
 * Mirrors every Unsplash photo referenced in src/lib/media.ts to
 * public/images/u so next/image optimises from local disk instead of
 * round-tripping to the Unsplash CDN on first request.
 *
 * Files are keyed by the Unsplash SHORT id (the segment in a
 * unsplash.com/photos/<id> URL) — stable, unique and human-checkable.
 * Re-run after referencing a new photo:  npm run images
 */
import { mkdir, writeFile, access } from 'node:fs/promises';

/** [shortId, width] — keep in sync with U() calls in src/lib/media.ts. */
const PHOTOS = [
  ['SkCMBjCspDU', 1920], // hero — one lit window in a dark block at night
  ['lrj7xeJlcb4', 1400], // candle at a dark window — the blackout evening
  ['2YNeDr89feQ', 1400], // warm floor lamp against a dark wall
  ['9CalgkSRZb8', 1600], // house roof with solar panels
  ['GXLPLG3_Vf4', 1400], // screwdriver on a consumer unit — installation
  ['_2AlIm-F6pw', 1400], // wiring work — texture behind the inverter block
  ['odyglVvZv18', 1400], // desk at night — laptop, lamp, city outside
  ['31dwLQWz0Ec', 1920], // wall of lit windows at night — final CTA
];

const OUT = new URL('../public/images/u/', import.meta.url);
await mkdir(OUT, { recursive: true });

for (const [shortId, w] of PHOTOS) {
  const file = new URL(`${shortId}-${w}.jpg`, OUT);
  try {
    await access(file);
    console.log(`· skip ${shortId}-${w}.jpg`);
    continue;
  } catch {}
  const res = await fetch(`https://unsplash.com/photos/${shortId}/download?w=${w}`, {
    headers: { 'user-agent': 'Mozilla/5.0' },
  });
  if (!res.ok) {
    console.error(`✗ ${shortId} → ${res.status}`);
    continue;
  }
  await writeFile(file, Buffer.from(await res.arrayBuffer()));
  console.log(`✓ ${shortId}-${w}.jpg`);
}
