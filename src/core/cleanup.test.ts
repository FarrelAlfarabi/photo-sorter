import { describe, expect, it } from "vitest";
import { buildCleanupPlan } from "./cleanup";
import type { PhotoAnalysis, PhotoMeta } from "./types";

const meta = (id: string, extra: Partial<PhotoMeta> = {}): PhotoMeta => ({
  id, takenAt: 0, width: 4000, height: 3000, filename: `${id}.jpg`, hasCameraExif: true, ...extra,
});
const A = "0000000000000000";
const A_NEAR = "0000000000000003"; // 2 bits away
const FAR = "ffffffffffffffff";
const an = (hash: string, sharpness = 500): PhotoAnalysis => ({ hash, sharpness });

describe("buildCleanupPlan", () => {
  it("keeps everything when nothing is wrong", () => {
    const plan = buildCleanupPlan([meta("a"), meta("b")], { a: an(A), b: an(FAR) });
    expect(plan.cuts).toEqual([]);
    expect(plan.bursts).toEqual([]);
  });

  it("suggests cutting a blurry photo", () => {
    const plan = buildCleanupPlan([meta("a")], { a: an(A, 10) });
    expect(plan.cuts).toEqual([{ id: "a", reason: "blurry" }]);
  });

  it("suggests cutting a screenshot", () => {
    const plan = buildCleanupPlan([meta("a", { filename: "Screenshot_1.png" })], { a: an(A) });
    expect(plan.cuts).toEqual([{ id: "a", reason: "screenshot" }]);
  });

  it("groups near-identical photos and picks the sharpest as the best", () => {
    const plan = buildCleanupPlan(
      [meta("a"), meta("b"), meta("c")],
      { a: an(A, 300), b: an(A_NEAR, 900), c: an(FAR, 500) },
    );
    expect(plan.bursts).toEqual([{ bestId: "b", ids: ["a", "b"] }]);
    expect(plan.cuts).toEqual([{ id: "a", reason: "duplicate", keptId: "b" }]);
  });

  it("an exact duplicate is reported as duplicate, not blurry, when both are fine", () => {
    const plan = buildCleanupPlan([meta("a"), meta("b")], { a: an(A, 500), b: an(A, 500) });
    expect(plan.cuts).toHaveLength(1);
    expect(plan.cuts[0].reason).toBe("duplicate");
  });

  it("never cuts every photo in a burst: a blurry burst still keeps its best shot", () => {
    const plan = buildCleanupPlan([meta("a"), meta("b")], { a: an(A, 10), b: an(A_NEAR, 20) });
    const cutIds = plan.cuts.map((c) => c.id);
    expect(cutIds).not.toContain("b");
    expect(cutIds).toContain("a");
  });

  it("a photo is only cut once even if it is blurry and a duplicate", () => {
    const plan = buildCleanupPlan([meta("a"), meta("b")], { a: an(A, 10), b: an(A_NEAR, 900) });
    expect(plan.cuts.filter((c) => c.id === "a")).toHaveLength(1);
  });

  it("every cut is only a suggestion", () => {
    const plan = buildCleanupPlan([meta("a")], { a: an(A, 10) });
    expect(plan.mode).toBe("suggest-only");
  });

  it("skips photos that have no analysis instead of crashing", () => {
    const plan = buildCleanupPlan([meta("a")], {});
    expect(plan.cuts).toEqual([]);
  });
});
