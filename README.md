# Photo Sorter

Android demo (Expo / React Native). One tap turns a messy camera roll into trip albums with junk suggested for removal. Runs on the phone. See `docs/design.md`.

## Run
```
npm install
npm test            # unit tests
npm run typecheck
npx expo start      # then open in Expo Go or a dev build on Android
```
Reading the photo library needs a development build on a real phone; Expo Go may limit media access on Android.

## Secrets
The optional AI step needs `GEMINI_API_KEY` as a Supabase secret. Never put it in this repo.
