import { describe, expect, it } from "vitest";
import { scoreCleanup } from "./score";

describe("scoreCleanup", () => {
  const key = { a: "keep", b: "keep", c: "cut", d: "cut" } as const;

  it("computes wrong-cut rate and catch rate", () => {
    const s = scoreCleanup(key, new Set(["b", "c"]));
    expect(s.wrongCutRate).toBe(0.5); // 1 of 2 good photos was flagged
    expect(s.catchRate).toBe(0.5); // 1 of 2 junk photos was found
  });

  it("is perfect when the cuts match the key", () => {
    const s = scoreCleanup(key, new Set(["c", "d"]));
    expect(s.wrongCutRate).toBe(0);
    expect(s.catchRate).toBe(1);
  });

  it("handles a key with no junk or no good photos without dividing by zero", () => {
    expect(scoreCleanup({ a: "keep" }, new Set()).catchRate).toBe(1);
    expect(scoreCleanup({ a: "cut" }, new Set()).wrongCutRate).toBe(0);
  });

  it("verdict follows the test plan gates", () => {
    const many: Record<string, "keep" | "cut"> = {};
    for (let i = 0; i < 100; i++) many[`k${i}`] = "keep";
    for (let i = 0; i < 100; i++) many[`c${i}`] = "cut";
    const cuts = (wrong: number, caught: number) =>
      new Set([...Array.from({ length: wrong }, (_, i) => `k${i}`), ...Array.from({ length: caught }, (_, i) => `c${i}`)]);
    expect(scoreCleanup(many, cuts(1, 80)).verdict).toBe("continue");
    expect(scoreCleanup(many, cuts(4, 80)).verdict).toBe("rework");
    expect(scoreCleanup(many, cuts(6, 80)).verdict).toBe("stop");
    expect(scoreCleanup(many, cuts(1, 60)).verdict).toBe("rework");
    expect(scoreCleanup(many, cuts(1, 40)).verdict).toBe("stop");
  });
});
