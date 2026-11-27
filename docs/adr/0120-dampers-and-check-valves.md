# 0120. Dampers and check valves: the casing as a short duct

- Status: Accepted (casing length `TODO(confirm)`)
- Date: 2026-11-27
- Source: the engineer's friend via the owner (2026-11-27): «дроссель клапана, обратные клапана»

## Context
A system's specification lists butterfly dampers (дросель-клапан) and check valves (зворотний клапан), round and rectangular. The calculator had no kind for them, and the import skipped every row with «клапан» in it (ADR 0061). These units are bought or made in the shop; the metal of the shop-made ones is mostly the casing, a short piece of duct of the system's size. The blade, the spindle and the drive are not sheet metal of the duct and are not modelled.

## Decision
- Four kinds: `roundDamper` (КДК, en CDM), `rectDamper` (ПДК, RDM), `roundCheckValve` (КЗК, CCV), `rectCheckValve` (ПЗК, RCV); fields: the size and the casing length `length`. A new side-panel group «Клапани» after the taps.
- Every figure is that of a straight of the same size and length: metal = perimeter x length, no allowance, waste factor = the seam allowance of non-elbows, thickness by its own size (ДБН), insulation like a straight, centre line = the length. The quantity is in pieces, as on every row, so the specification shows the units by piece.
- Casing length prefill 200 mm for both kinds (`config.valve`, form only, `TODO(confirm)`: catalogue units are roughly 200-300 mm long; no norm).
- Import: codes КДК / ПДК / КЗК / ПЗК (and the English ones), words «дросель», «дроссель», «damper», «зворотний / обратный клапан», «check valve». Other valves (fire, air) stay not recognised.
- Sketch: the straight casing with the blade outline (dashed) at mid-length and the spindle on top; glyph the same.

## Consequences
A bought unit still counts its casing metal; a user who buys it ready can set the quantity 0 or delete the row (a "bought, no metal" option is open, ask the engineer). The pressure loss of a damper (its zeta) is not modelled beyond the usual local coefficient field; aerodynamics stays a separate mode.
