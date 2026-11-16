# 0042. Two areas: metal consumption and actual area

- Status: Accepted. Supersedes the cut-out subtraction of [0021](0021-tees-and-crosses.md) for the order (the actual area still subtracts it) and adds a consumption rule to [0005](0005-reducer-length-default-and-floor.md) (the typed length is still never clamped).
- Date: 2026-11-16
- Source: engineer answers of 2026-11-16, items 2 and 3 ([log](../engineer-answers.md#answers-of-2026-11-16)), after the check against his three orders (`reports/engineer-tables-check-2026-11-12.md` in the project files)

## Context
In the engineer's practice-proven orders reducers are 20-37 % larger than ours: his tables count every reducer shorter than 300 mm as 300 mm long (`IF(L<0,3; 0,3)`), because a shorter part is not made. Tees and crosses are 3-21 % larger: his tables do not subtract the branch cut-out, which goes to scrap. The engineer asked to show both numbers: what the workshop spends and what the part actually is.

## Decision
- **Actual area** (`metalArea`, unchanged): the geometry as typed, waste factor included. Reducers by the typed length, tees and crosses minus the branch cut-outs.
- **Metal consumption** (`calc/consumption.ts`, `metalConsumption` = `consumptionArea` x `wasteFactor`): reducers (round, rect, rect-to-round) with the axial length raised to `config.consumption.minReducerLengthMm` (300 mm), the same surface formula otherwise; tees and crosses without subtracting the cut-outs; every other kind equals the actual area. The fitting itself is never changed.
- The order area, the sheet list by thickness, the sheet count and the metal price use the consumption (`sheetList(items, config, metalConsumption)`; the default argument is still `metalArea`). Insulation keeps the actual geometry. Pressure losses and `centerlineLength` are not affected.
- UI: the results table has both, per piece and in total («Фактична площа» and «Витрата металу*»), with a footnote when a short reducer, a tee or a cross is in the list; the totals show the actual area, the consumption and the consumption with the margin to order.

## Consequences
- With 300 mm reducers and no tees the numbers are as before. A tee or cross always has a consumption above its actual area.
- A tee whose cut-out is larger than its wall is still rejected (the actual area is checked).
- The 300 mm floor is a config value, not a user setting yet; the engineer's "basic / advanced" mode may expose it.
