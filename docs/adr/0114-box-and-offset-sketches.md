# 0114. Sketches of adapters / boxes and offsets

- Status: Accepted
- Date: 2026-11-26
- Source: owner (2026-11-26, «делаем» on the offer of own sketches for ПА / ПУ / КУ)

## Context
[0113](0113-adapters-boxes-and-offsets-beta.md) drew the three beta kinds as a straight piece, which did not show their extra sizes (ends, partitions, offset H).

## Decision
- New sketch shapes `box` and `offset` in `sketch-spec.ts`, drawn by `iso-sketch.ts` in the same line style and dimension rules as the other kinds ([0033](0033-isometric-sketch.md)).
- ПА: a closed box, end plates toned as plates, one partition dashed in the middle; a₁, b₁, L.
- ПУ / КУ: a straight slanted duct raised by H (the «підйом» of a spec), centre line dash-dot, the inlet axis carried on to show H beside the inlet; on ПУ the raised side a₁ stands vertical. d₁ or a₁ × b₁ at the outlet, L below. A short straight allowance strip stands at each end, p dimensioned at the outlet in a chain with L (owner, 2026-11-26: «нужно также показывать и припуск»).
- Legends: «торці й перемички — пластини a₁ × b₁» for the box, «H — зміщення осі» and «p — припуск на кожному кінці» for offsets; rail glyphs for both shapes (`KindGlyph`).

## Consequences
- The layout tests of `iso-sketch.test.ts` (labels off the walls, no crossing dimensions) cover the new kinds as they cover every kind.
- The old side / profile views draw both shapes as a straight piece (unused by the card).

## Addendum 2026-11-26: the allowance on every sketch
Owner: «да, нужно показывать его на всех деталях». Every kind with an allowance (elbows, reducers, rect-to-round, tees, crosses, offsets) marks where the allowance strip starts at each end with a thin section line (reducers, rect-to-round and elbows draw the strips as straight pieces of the end size, the taper or the bend only between them; owner, 2026-11-26) (`seamRound`, `seamRect`: the near half of a ring, a section rectangle with its far edges dashed) and dimensions p once, at the outlet or the right end of the run. The strip length on the drawing is schematic (`P`). The legends add «p — припуск на кожному кінці».
