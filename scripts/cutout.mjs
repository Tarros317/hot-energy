/**
 * Product shots arrive on a seamless white studio background. On a near-black
 * page that reads as a bright rectangle, so the background is flood-filled to
 * transparent from the image border — only white pixels CONNECTED to the edge
 * are removed, which keeps white areas inside the product (the inverter's own
 * casing) intact.
 */
import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';

const [, , input, output, thrArg, trimArg] = process.argv;
const THRESHOLD = Number(thrArg ?? 244); // min channel value counted as "white"
const TRIM = trimArg === 'trim';

const src = sharp(input).ensureAlpha();
const { data, info } = await src.raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;

const isBg = (i) => {
  const r = data[i], g = data[i + 1], b = data[i + 2];
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  return min >= THRESHOLD && max - min <= 10; // bright AND neutral
};

const seen = new Uint8Array(W * H);
const stack = [];
for (let x = 0; x < W; x++) { stack.push(x, x + (H - 1) * W); }
for (let y = 0; y < H; y++) { stack.push(y * W, W - 1 + y * W); }

while (stack.length) {
  const p = stack.pop();
  if (seen[p]) continue;
  const i = p * C;
  if (!isBg(i)) continue;
  seen[p] = 1;
  data[i + 3] = 0;
  const x = p % W, y = (p / W) | 0;
  if (x > 0) stack.push(p - 1);
  if (x < W - 1) stack.push(p + 1);
  if (y > 0) stack.push(p - W);
  if (y < H - 1) stack.push(p + W);
}

let out = sharp(data, { raw: { width: W, height: H, channels: C } }).png();
if (TRIM) out = out.trim({ threshold: 0 });
await writeFile(output, await out.toBuffer());
const meta = await sharp(output).metadata();
console.log(`✓ ${output} ${meta.width}×${meta.height}`);
