export type Label = "keep" | "cut";
export type Verdict = "continue" | "rework" | "stop";

export interface CleanupScore {
  /** Share of good photos the app wrongly flagged. The hard gate. */
  wrongCutRate: number;
  /** Share of junk photos the app found. */
  catchRate: number;
  verdict: Verdict;
}

/** Scores a cleanup run against a hand-labelled answer key, using the gates from the test plan. */
export function scoreCleanup(key: Record<string, Label>, flagged: Set<string>): CleanupScore {
  const ids = Object.keys(key);
  const keeps = ids.filter((id) => key[id] === "keep");
  const junk = ids.filter((id) => key[id] === "cut");
  const wrongCutRate = keeps.length ? keeps.filter((id) => flagged.has(id)).length / keeps.length : 0;
  const catchRate = junk.length ? junk.filter((id) => flagged.has(id)).length / junk.length : 1;

  let verdict: Verdict;
  if (wrongCutRate > 0.05 || catchRate < 0.5) verdict = "stop";
  else if (wrongCutRate <= 0.02 && catchRate >= 0.7) verdict = "continue";
  else verdict = "rework";
  return { wrongCutRate, catchRate, verdict };
}
