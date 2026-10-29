import { describe, expect, it } from "vitest";
import { dHash, hammingDistance, laplacianVariance } from "./analysis";

/** Builds a grayscale grid from a function of x and y. */
const grid = (w: number, h: number, f: (x: number, y: number) => number) =>
  Array.from({ length: w * h }, (_, i) => f(i % w, Math.floor(i / w)));

describe("dHash", () => {
  it("needs a 9 by 8 grid", () => {
    expect(() => dHash([1, 2, 3])).toThrow(/72/);
  });
  it("gives 16 hex characters", () => {
    expect(dHash(grid(9, 8, (x) => x * 10))).toMatch(/^[0-9a-f]{16}$/);
  });
  it("is the same for a brighter copy of the same picture", () => {
    const base = grid(9, 8, (x, y) => (x * 7 + y * 3) % 50);
    const bright = base.map((v) => v + 40);
    expect(dHash(bright)).toBe(dHash(base));
  });
  it("differs for a different picture", () => {
    const a = grid(9, 8, (x) => x * 10);
    const b = grid(9, 8, (x) => 100 - x * 10);
    expect(hammingDistance(dHash(a), dHash(b))).toBeGreaterThan(30);
  });
});

describe("hammingDistance", () => {
  it("counts differing bits", () => {
    expect(hammingDistance("0000000000000000", "0000000000000000")).toBe(0);
    expect(hammingDistance("0000000000000000", "000000000000000f")).toBe(4);
    expect(hammingDistance("ffffffffffffffff", "0000000000000000")).toBe(64);
  });
});

describe("laplacianVariance", () => {
  it("is zero for a flat grey picture", () => {
    expect(laplacianVariance(grid(10, 10, () => 128), 10, 10)).toBe(0);
  });
  it("is higher for a sharp checkerboard than a smooth gradient", () => {
    const sharp = laplacianVariance(grid(16, 16, (x, y) => ((x + y) % 2) * 255), 16, 16);
    const smooth = laplacianVariance(grid(16, 16, (x) => x * 4), 16, 16);
    expect(sharp).toBeGreaterThan(smooth * 100);
  });
  it("rejects a grid with the wrong size", () => {
    expect(() => laplacianVariance([1, 2, 3], 10, 10)).toThrow(/size/i);
  });
});

import { downsampleGray } from "./analysis";

describe("downsampleGray", () => {
  it("averages blocks of pixels", () => {
    // 4x2 grid down to 2x1: left block is 0,0,10,10 -> 5, right block is 20,20,30,30 -> 25
    expect(downsampleGray([0, 0, 20, 20, 10, 10, 30, 30], 4, 2, 2, 1)).toEqual([5, 25]);
  });
  it("rejects sizes that do not divide evenly", () => {
    expect(() => downsampleGray([1, 2, 3], 3, 1, 2, 1)).toThrow(/evenly/i);
  });
});
