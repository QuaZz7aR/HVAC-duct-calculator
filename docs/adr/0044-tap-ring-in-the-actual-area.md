# 0044. Tap ring in the actual area

- Status: Accepted. Supersedes the "actual area stays the stub only" part of [0043](0043-tap-ring-in-the-metal-consumption.md).
- Date: 2026-11-16
- Source: engineer's answer to the ADR 0043 question, 2026-11-16 ("це буде фактична площа металу; і для прямокутних теж треба"), relayed by the owner, who approved the change ([log](../engineer-answers.md#answers-of-2026-11-16))

## Context
ADR 0043 added the flat ring around a tap stub to the metal consumption only and asked whether it is also part of the actual area. The engineer answered that it is the actual metal area, for round and rect taps alike.

## Decision
- `metalArea` = (`sheetArea` + `tapRingArea`) x waste factor. `tapRingArea` moved to `calc/tap-ring.ts`, which is imported by both `waste-factor.ts` and `consumption.ts`.
- `sheetArea` stays the wall geometry of the stub (pure, no config), so insulation stays on the stub only.
- For taps the consumption equals the actual area again, `consumptionDiffers` is false and the consumption footnote no longer mentions taps.
- The rect frame (a + 2w)(b + 2w) - ab is kept (the engineer: rect taps need the ring too). The 50 mm width stays `TODO(confirm)`.

## Consequences
- Квр d150 L100: actual area 0.0471 -> 0.0785 m2; Пвр 300x100: 0.08 -> 0.13.
- Existing tests that pinned the stub-only metal area of taps (`taps.test.ts`, `taps-form.test.ts`, `tap-ring.test.ts`) were updated by the owner; `taps.fixtures.ts` is unchanged (its `area` is the stub geometry, `sheetArea`).
