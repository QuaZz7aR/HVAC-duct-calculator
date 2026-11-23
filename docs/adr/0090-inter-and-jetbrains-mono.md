# 0090. Inter and JetBrains Mono

Status: Accepted
Date: 2026-11-23
Source: Nikita (2026-11-23): strict, clear technical fonts; picked pair 2 of six compared (Plex, Inter + JetBrains Mono, Roboto Condensed + Roboto Mono, Fira, Golos Text, PT)

## Context
The site used IBM Plex Sans and IBM Plex Mono through `next/font/google` (`src/app/layout.tsx`), wired as CSS variables in `globals.css`; no component names a font.

## Decision
Inter (400, 500, 600) for the text and JetBrains Mono (400, 500) for `font-mono` (inputs, kind codes, numbers), Latin and Cyrillic subsets, still self-hosted by `next/font`. The variables are renamed `--font-sans-ui` / `--font-mono-ui` so they do not name the font.

## Consequences
None of the compared fonts has the subscript digits ₁ ₂ (d₁, a₁); they fall back to a system font, as before. README screenshots need a retake.
