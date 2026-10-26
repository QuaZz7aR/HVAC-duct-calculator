# 0030. Beta start state, card view state and card look

- Status: Accepted (the beta start state is temporary)
- Date: 2026-10-22
- Source: owner + engineer advice (2026-10-22); PR #25, #26, #27

## Context
With 19 fitting kinds the list gets long; during the beta the owner wants visitors to see every kind at once.

## Decision
- **Card view state**: `FittingList` keeps, per card, whether the sketches are open and whether the card is folded to a tile; the header buttons set all cards at once (and the default for new rows). A folded tile shows number, kind, typed values and a ⚠ when the row has errors, so errors are not lost by folding. Tiles sit in a 1-3 column grid so 19 of them fit one screen.
- **Grouping**: rows of the same kind are shown together in one section (a titled box with the count and its own fold button) whenever a kind appears more than once, in the order the kinds first appear; rows keep their list number, so the numbers match the results table. The grouping is derived, nothing is stored, so changing a row's kind moves it.
- **Clone**: every card has a clone button (the copy is inserted right after the original, so it lands in the same kind section; the bottom «add» button added a new empty row of the default kind, removed on 2026-10-23, [0031](0031-side-panel-for-adding-fittings.md)).
- The results table rows highlight on hover (`hover:bg-accent-soft`, PR #27). The kind select is wide enough for the longest kind name (the select was replaced by a title and a «⋯» menu on 2026-10-23, [0031](0031-side-panel-for-adding-fittings.md)). View state is not persisted.
- **Beta start state** (owner): while the site is in beta, the page opens with one example row of every fitting kind (`form/sample-rows.ts`, example sizes, not real data) and the sketches are open by default; the button still hides them.
- **Look** of the cards follows the mockup the owner chose: blueprint-paper neutrals and one blue accent as CSS tokens in `globals.css` (light and dark by `prefers-color-scheme`), IBM Plex Sans / Mono through `next/font/google`, outlined "Показати схеми" and "Видалити" buttons, filled primary "Додати деталь" (`styles.ts`).
- **Card layout rules** (owner, 2026-10-22): the inputs of a card are spread over balanced rows (counts differ by at most one) and the widest label sets the input width, so no label wraps (`form/layout.ts`); in the cross-section the main size is measured below and left, the small end or branch above and right, so no two dimension lines share a row; the select chevron flips while the list is open.

## Consequences
- Revert the beta start state when the beta ends: the `useCalculator` initial state (one empty row) and `sketchesOpenByDefault` in `sample-rows.ts`.
- IBM Plex through `next/font/google` replaces the system-font rule of [0012](0012-first-ui.md).
- The card view state moved from `FittingList` to `useCardView` on 2026-10-23 ([0031](0031-side-panel-for-adding-fittings.md)).
