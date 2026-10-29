# 0001. On-device cleanup first, AI labels optional

Status: accepted (2026-10-29, Farrel)

## Decision
The core feature (trips, duplicates, blur, screenshots, best shot) runs on the phone with no upload.
AI labeling is optional and sits behind one `VisionModel` interface in `supabase/functions/_shared/model.ts`.

## Why
- Free to run and private. No AI bill for the main feature.
- The free Gemini tier may use inputs to improve Google products and is not allowed for apps used by under 18s. So it is for consented demo photos only.

## Consequences
- The Gemini key lives only in the Supabase secret `GEMINI_API_KEY`. Never in the app or git.
- Swapping to Claude Haiku later means writing one new `VisionModel`, plus its tests.
- Cuts are suggest-only and Android asks for confirmation before deleting.
