# 0094. Size indices as `<sub>`, not Unicode subscript digits

Status: Accepted
Date: 2026-11-24
Source: Nikita (2026-11-24): the ₁ / ₂ in d₁, a₁ come from a serif fallback font

## Context
The size letters are d₁, a₁, b₁, d₂, a₂, b₂ (ADR 0034), written with the Unicode subscript digits U+2081 / U+2082. Inter and JetBrains Mono are loaded through `next/font/google` with the `latin` and `cyrillic` subsets (ADR 0090); no Google Fonts subset of either covers U+2080-2089, so the browser drew those digits from a fallback font, often a serif one.

## Decision
- The dictionaries keep the Unicode letters (they stay plain strings for titles, `aria-label`, the SVG sketch and the tests).
- HTML rendering splits them: `subs(text)` in `src/components/calculator/subscripts.tsx` turns a run of U+2080-2089 into `<sub>` with ASCII digits. It is applied to field labels (`TextField`), «i» texts (`Info`), the sketch legend in the card, the sizes in the results and in the import preview. `sub` is styled in `globals.css` (0.72 em, lowered 0.2 em, line height 0, so a line does not grow).
- SVG `<text>` cannot hold `<sub>` without changing the label text, so the sketch labels keep the Unicode digits and skip Inter: `svg text` uses the system sans stack (system-ui, -apple-system, Segoe UI, Roboto, Arial), which has the subscript glyphs on Windows, macOS / iOS and Android.

## Consequences
Every new place that shows a size letter in HTML wraps the string in `subs()`. A copied label (clipboard) gives "d1" in place of "d₁"; accepted.
