# 0029. Fitting sketches on each card

- Status: Accepted; the layout of the two sketches is amended by [0032](0032-sketch-panels-and-field-alignment.md)
- Date: 2026-10-22
- Source: owner idea (2026-10-19), card design 3 chosen by the owner (2026-10-22); PR #25

## Context
Owner idea: a picture per fitting kind so users see what the part is.

## Decision
- Each card has a "Показати схеми" button that toggles two schematic inline SVGs side by side (open by default during the beta, see [0030](0030-beta-start-state-and-card-view.md)): the side view and the cross-section "в профіль" (`FittingSketch` with `view`, `sketch-spec.ts`), not to scale, no new dependency, dark-theme aware.
- Dimension labels sit beside the drawing on dimension lines, never over it; the elbow radius line runs to the centre line for the round elbow (КО) and to the inner edge for the rect one (ПО), as the field means.
- Labels (a short legend under each sketch names them, with the radius worded as the field has it: centre line for round elbows, inner for rect): Д / Ш × В (main or large end), д / ш × в (small end or branch), L, R, α, l.
- Drawn from the kind's geometry, not from the engineer's Excel sketches: replace them if he provides drawings. Fitting names are unchanged.

## Consequences
Added `vitest.config.mts` (the `@/` alias) so components can be tested with `react-dom/server`.
