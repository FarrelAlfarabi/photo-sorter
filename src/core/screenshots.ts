import type { PhotoMeta } from "./types";

const NAME = /screen[\s_-]?shot/i;
/** Phone screens are long and thin; camera photos are 4:3 or 16:9 at most. */
const SCREEN_RATIO = 1.7;

export function looksLikeScreenshot(p: PhotoMeta): boolean {
  if (NAME.test(p.filename)) return true;
  const long = Math.max(p.width, p.height);
  const short = Math.min(p.width, p.height);
  return p.hasCameraExif === false && short > 0 && long / short >= SCREEN_RATIO;
}
