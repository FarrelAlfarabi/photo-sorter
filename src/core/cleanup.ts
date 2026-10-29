import { hammingDistance } from "./analysis";
import { looksLikeScreenshot } from "./screenshots";
import type { PhotoAnalysis, PhotoMeta } from "./types";

export type CutReason = "blurry" | "screenshot" | "duplicate";

export interface Cut {
  id: string;
  reason: CutReason;
  /** For duplicates: the photo we suggest keeping instead. */
  keptId?: string;
}

export interface Burst {
  bestId: string;
  ids: string[];
}

export interface CleanupPlan {
  /** Nothing is deleted by the plan. The user reviews it first. */
  mode: "suggest-only";
  cuts: Cut[];
  bursts: Burst[];
}

export interface CleanupOptions {
  /** Sharpness below this counts as blurry. */
  blurThreshold?: number;
  /** Hashes this many bits apart or fewer count as the same shot. */
  maxHashDistance?: number;
}

export function buildCleanupPlan(
  photos: PhotoMeta[],
  analysis: Record<string, PhotoAnalysis>,
  opts: CleanupOptions = {},
): CleanupPlan {
  const blurThreshold = opts.blurThreshold ?? 100;
  const maxDistance = opts.maxHashDistance ?? 6;

  const cutById = new Map<string, Cut>();
  const candidates: PhotoMeta[] = [];
  for (const p of photos) {
    if (looksLikeScreenshot(p)) cutById.set(p.id, { id: p.id, reason: "screenshot" });
    else if (analysis[p.id]) candidates.push(p);
  }

  // Cluster near-identical shots with union-find. Pairwise is fine for a demo (a few thousand photos).
  const parent = candidates.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const d = hammingDistance(analysis[candidates[i].id].hash, analysis[candidates[j].id].hash);
      if (d <= maxDistance) parent[find(j)] = find(i);
    }
  }
  const clusters = new Map<number, PhotoMeta[]>();
  candidates.forEach((p, i) => {
    const root = find(i);
    clusters.set(root, [...(clusters.get(root) ?? []), p]);
  });

  const bursts: Burst[] = [];
  for (const members of clusters.values()) {
    if (members.length === 1) {
      const [only] = members;
      if (analysis[only.id].sharpness < blurThreshold) cutById.set(only.id, { id: only.id, reason: "blurry" });
      continue;
    }
    const best = members.reduce((a, b) => (analysis[b.id].sharpness > analysis[a.id].sharpness ? b : a));
    bursts.push({ bestId: best.id, ids: members.map((m) => m.id) });
    for (const m of members) {
      if (m.id !== best.id) cutById.set(m.id, { id: m.id, reason: "duplicate", keptId: best.id });
    }
  }

  const order = new Map(photos.map((p, i) => [p.id, i]));
  const byOrder = (a: { id: string }, b: { id: string }) => order.get(a.id)! - order.get(b.id)!;
  return {
    mode: "suggest-only",
    cuts: [...cutById.values()].sort(byOrder),
    bursts: bursts.sort((a, b) => order.get(a.ids[0])! - order.get(b.ids[0])!),
  };
}
