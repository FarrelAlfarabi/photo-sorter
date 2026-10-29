# Design note: Photo Sorter Android demo

Edge (from the research and test-plan pages): one tap turns a messy camera roll into clean trip albums with junk removed, mostly on the phone, free.

## What the demo does
1. Reads the latest 300 photos (time, GPS, size, name, camera data).
2. Shrinks each to 90x80, then computes a fingerprint (dHash) and a sharpness score.
3. Groups photos into trips by time and place, and trips into days.
4. Suggests cuts: screenshots, blurry photos, duplicates. Keeps the sharpest of each burst.
5. Shows a preview. Nothing changes until the user taps "Create trip albums" (copies, never moves) or "Remove suggested junk" (Android confirmation).

## Code map
- `src/core/`: all decisions, pure functions, fully unit tested (trips, analysis, screenshots, cleanup, score).
- `src/device/convert.ts`: tested helpers. `src/device/scan.ts`: phone access, needs a real device.
- `App.tsx`: one screen.
- `supabase/functions/label`: optional AI label step. `_shared/model.ts` is the swap point.

## Known gaps (be honest)
- Not yet run on a real phone. The Android bundle builds; behaviour on a device is untested.
- Blur threshold (100) and hash distance (6) are guesses on a 90x80 image. Calibrate with the labelled set in `docs/testing.md`.
- No AI labels in the UI yet. The function exists but the app does not call it.
- Typed-request sorting, shared trips, ads and subscriptions are cut from the demo on purpose.
