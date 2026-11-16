# 0043. Tap ring in the metal consumption

- Status: Accepted. Supersedes the ring part of [0026](0026-branch-in-taps.md) (the actual area of a tap is unchanged).
- Date: 2026-11-16
- Source: engineer answers of 2026-11-16, item 5, clarified the same day: "the ring around the stub" ([log](../engineer-answers.md#answers-of-2026-11-16)); the check against his orders (`reports/engineer-tables-check-2026-11-12.md` in the project files, Квр d200: 0.1021 m2 against our 0.0628)

## Context
The Excel and the engineer's tables add a flat ring to every Квр, pi(d/2 + 50)^2 - pi d^2/4: the flange the stub rests on and is fixed with to the main duct. ADR 0026 left it out because it looked like a misused `allowance`. The engineer now asks for it. The Пвр term of the Excel (8 x l mm2) is broken and gives no usable rect formula.

## Decision
- `tapRingArea(f, config)` in `calc/consumption.ts`: round tap = annulus pi((d/2 + w)^2 - (d/2)^2), rect tap = frame (a + 2w)(b + 2w) - ab, w = `config.tap.ringWidthMm` = 50 mm (`TODO(confirm)`: the Excel value; the rect frame is our analogue of the round ring).
- The ring is added to the **metal consumption** of taps (`consumptionArea` = stub + ring), so the order, the sheet list, the sheet count and the metal price include it, as in his tables. `consumptionDiffers` is true for taps while the ring width is above 0.
- The **actual area** (`sheetArea`, `metalArea`) stays the stub only, as do insulation (the ring lies on the main duct, under its insulation) and the thickness (by the tap's size).
- The footnote under the results names the ring. The width is a config value, not a user field yet.

## Consequences
- With the default config every tap's consumption grows: Квр d200 L100 0.0628 -> 0.1021 m2 (equal to his order), Пвр 300x100 0.08 -> 0.13.
- Fixtures: `__fixtures__/tap-ring.fixtures.ts`; `taps.fixtures.ts` (actual area) is unchanged.
- Open: whether the ring also belongs in the actual area, and the rect ring formula; both to the engineer.
