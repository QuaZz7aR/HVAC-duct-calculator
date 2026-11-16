# 0045. Straight ducts split into shop pieces

- Status: Accepted
- Date: 2026-11-16
- Source: feedback from the engineer's acquaintances (2026-11-12, "СНВ caps a piece at 3 m: 22.5 m gives 7 x 3 m + 1 x 1.5 m"); defaults chosen by the owner 2026-11-16 from the engineer's orders (round 3.0 m spiral at Електротяжмаш, rect 1.25 m = sheet width everywhere).

## Context
Engineers split long straights into shop pieces by hand. The tool took one length per row and said nothing about pieces.

## Decision
- Round and rect straights get a form field "max piece length", mm (`FieldKey` `maxPiece`, `formOnly`: not part of the core fitting). Prefill from `config.straightPiece` (round 3000, rect 1250, `TODO(confirm)`: no norm, ДБН В.2.5-67 sets no piece length).
- Empty or 0 = no split; a negative or non-numeric value is a row error on that field.
- `form/pieces.ts` `splitLength(L, max)` -> `{ full, pieceMm, restMm }`: `floor(L / max)` pieces of `max` plus one remainder piece (a small remainder stays its own piece, since joining it would exceed the cap). Null when `L <= max`.
- The results table shows "ланки: 7 × 3 м + 1 × 1,5 м" under the row title, per one item (the quantity column multiplies it).
- The area is unchanged: straights have no allowance, so the pieces sum to the same perimeter x length. The core (`src/lib/calc`) only gains the config entry.

## Consequences
- No new fixtures; form tests cover the split.
- Not done: nipples / couplings per joint (pieces - 1), per-piece allowance, a spiral vs straight-seam choice. Revisit if the engineer asks.
