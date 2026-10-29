/** Hash of a 9 by 8 grayscale grid: each bit says "is this pixel brighter than its right neighbour". */
export function dHash(gray: number[]): string {
  if (gray.length !== 72) throw new Error(`dHash needs 72 values (9x8), got ${gray.length}`);
  let bits = 0n;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      bits = (bits << 1n) | (gray[y * 9 + x] > gray[y * 9 + x + 1] ? 1n : 0n);
    }
  }
  return bits.toString(16).padStart(16, "0");
}

/** Number of bits that differ between two 16-character hex hashes. */
export function hammingDistance(a: string, b: string): number {
  let diff = BigInt("0x" + a) ^ BigInt("0x" + b);
  let count = 0;
  while (diff > 0n) {
    count += Number(diff & 1n);
    diff >>= 1n;
  }
  return count;
}

/** Sharpness score: how much the second derivative varies. Blurry pictures score low. */
export function laplacianVariance(gray: number[], width: number, height: number): number {
  if (gray.length !== width * height) throw new Error("grid size does not match width x height");
  const responses: number[] = [];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      responses.push(gray[i - 1] + gray[i + 1] + gray[i - width] + gray[i + width] - 4 * gray[i]);
    }
  }
  if (responses.length === 0) return 0;
  const mean = responses.reduce((s, v) => s + v, 0) / responses.length;
  return responses.reduce((s, v) => s + (v - mean) ** 2, 0) / responses.length;
}

/** Shrinks a grayscale grid by averaging blocks. Sizes must divide evenly. */
export function downsampleGray(gray: number[], w: number, h: number, outW: number, outH: number): number[] {
  if (w % outW !== 0 || h % outH !== 0) throw new Error("Sizes must divide evenly");
  const bw = w / outW;
  const bh = h / outH;
  const out: number[] = [];
  for (let oy = 0; oy < outH; oy++) {
    for (let ox = 0; ox < outW; ox++) {
      let sum = 0;
      for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) sum += gray[(oy * bh + y) * w + ox * bw + x];
      out.push(sum / (bw * bh));
    }
  }
  return out;
}
