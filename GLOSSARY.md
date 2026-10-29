# Glossary

- **Trip**: a run of photos with no gap over 48 hours and no jump over 100 km between them.
- **Burst**: photos that look almost the same (hash distance 6 bits or less). One is the best shot.
- **Best shot**: the sharpest photo in a burst.
- **Cut**: a photo the app suggests removing: blurry, screenshot, or duplicate. Always a suggestion, never automatic.
- **Hash (dHash)**: a 64-bit fingerprint of a picture's shape. Similar pictures have similar fingerprints.
- **Sharpness**: Laplacian variance of a small grayscale copy. Low means blurry.
- **Wrong-cut rate**: share of good photos wrongly suggested for removal. The hard test gate.
- **Catch rate**: share of real junk the app found.
- **Label**: optional AI description and tags for one small preview photo (Gemini now, swappable).
