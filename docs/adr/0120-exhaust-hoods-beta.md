# 0120. Exhaust hoods (зонт) as a beta from open formulas

Status: Accepted (beta)
Date: 2026-11-27
Source: owner (Nikita), 2026-11-27, from the talk with the engineer's friend: "добавить позицию расчет вытяжных зонтов, на них утеплители не нужны"

## Context
An exhaust hood is a pyramid sheet: an open rectangular bottom A x B, a stub on top (rectangular or round) and a height. ADR 0079 imports a «зонт» from a name as a cap (lid + rim), which matches the engineer's template for the flat kitchen hoods of the АКБ order. A pyramid hood has no kind yet, and a hood is never insulated.

## Decision
- Two beta kinds in the «Бета» group: `rectHood` «ЗнП — Зонт витяжний» (bottom a₁ × b₁, rect stub a₂ × b₂) and `rectHoodRoundStub` «ЗнК — Зонт витяжний, круглий патрубок» (bottom a₁ × b₁, stub d₂). English RH, RHC. The second letter is lower case so that the codes do not clash with a future «ЗК» (зворотний клапан).
- Geometry is the reducer the hood is: the exact four-trapezoid frustum of `rectReducer` and the exact rect-to-round layout of ADR 0035, over the height L. Allowance strips at the counted ends as on every part (2 by default: the stub and the bottom edge). A vertical rim «Борт знизу» (`skirt`, mm, prefill 0, empty = 0) adds bottom perimeter × rim. The bottom stays open.
- Thickness by the bottom, the larger end, as reducers are keyed by their larger end. No minimum-length rule in the consumption: consumption = actual area. Centre line = the height (aerodynamics only, hidden).
- Not insulated: the card has no insulation choice (`noInsulation` in `form/fields.ts`), `calculate` ignores a material left from a kind change, `insulated()` throws for a hood.
- Import: by the codes ЗнП / ЗнК / RH / RHC only, and these codes win over «зонт» in the name. A «зонт» named without one of these codes stays a cap (ADR 0079 unchanged), so the АКБ hoods keep matching the order.
- Sketch: the reducer drawing (round or rect stub), no own drawing yet.

## Consequences
New `FieldKey` `skirt`, error code `skirt.negative`. Fixtures `hoods.fixtures.ts` (four cases) and `hoods.test.ts` come from the owner's patch. `TODO(confirm)`: the formulas, the rim prefill 0, thickness by the bottom, whether a «зонт» in a name should become a hood rather than a cap.
