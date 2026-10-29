# Testing plan

Source: the Trip Cleanup Edge and Test Plan page (https://claude.ai/artifact/3ioER5xLG6HuvMymB4H32C). Cost: zero.

## Automated (TDD, run on every change)
`npm test` runs 56 unit tests. Rule: write the failing test first, then the code.
- trips: time gaps, place jumps, days and time zones
- analysis: fingerprint, sharpness, shrinking
- screenshots, cleanup plan (never cuts the best shot of a burst; one cut per photo)
- score: wrong-cut rate and catch rate against the gates below
- label function: key goes in a header only, errors never leak the key

## Manual, on a real Android phone
1. Build a labelled set of about 300 consented photos (keep or cut, trip, day, best of burst).
2. Run the app, export which ids it flagged, and score with `scoreCleanup` in `src/core/score.ts`.
3. Tune `blurThreshold` and `maxHashDistance` in `src/core/cleanup.ts`.
4. Five-friend script from the test plan page.

## Gates
| Measure | Continue | Stop |
|---|---|---|
| Wrong-cut rate | 2% or less | over 5% |
| Catch rate | 70% or more | under 50% |
| Best-pick hit rate | 70% or more | under 55% |

## Data rules
Only consented photos. Delete the set after testing. Free Gemini tier may use inputs to improve Google products, so no AI labeling on private photos.
