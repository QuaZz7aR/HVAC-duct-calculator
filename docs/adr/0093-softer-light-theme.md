# 0093. Softer light theme (grey-blue, no pure white)

Status: Accepted
Date: 2026-11-23
Source: Nikita (2026-11-23): too much white in the light theme, it tires the eyes; picked variant C «голубой чертёж» of three

## Context
The light palette had white cards (`--panel: #ffffff`) on a near-white page (`#f3f5f7`). Three variants were compared on screenshots: A neutral grey one tone darker, B warm paper, C grey-blue blueprint.

## Decision
Variant C, light theme only (the dark palette is unchanged): `--background #e1e9f1`, `--panel #f0f4f8`, `--bar #cfdae6`, `--line #bccbda`, `--accent-soft #dce7f8`. Foreground, muted, accent and single colours stay. Contrast (WCAG AA, 4.5:1 for text): foreground ≥ 11.6, muted ≥ 4.9, accent on page / panel / accent-soft 4.7 / 5.3 / 4.6.

## Consequences
Only tokens in `globals.css` change; components already use the tokens. README screenshots retaken.
