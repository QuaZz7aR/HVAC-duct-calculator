# 0038. Price: user-entered UAH per m² per thickness and material

- Status: Accepted
- Date: 2026-11-03
- Source: owner, 2026-11-03 (chose price as the next step); the engineer's order of features, 2026-10-16 (metal, insulation, price, then aerodynamics)

## Context
After metal and insulation areas the next step is a cost estimate. There is no source for real prices (suppliers, regions and dates differ), and the engineer gave no price list. Metal is sold by thickness, insulation by material, and the app already groups areas that way (sheet list, insulation list).

## Decision
- The user types a price in UAH per m² for each line of the metal list (per thickness) and the insulation list (per material), in a price column of those tables. Nothing is preset; an empty price means "no price", not zero.
- Metal cost = area to order (order margin included, [0024](0024-order-margin-and-sheet-count.md)) x price: the margin is the metal actually bought. Insulation cost = its computed area x price: the order margin is for metal only and the insulation list has no margin.
- Totals show metal cost, insulation cost and the sum. Unpriced lines are counted and reported ("без ціни: N поз."), never treated as free; a cost with no priced line shows a dash.
- A bad price (not a number, negative, absurdly large) is reported under the totals and the line stays unpriced; the areas are never affected.
- Prices are kept by thickness and material code, so a line that leaves the list and comes back keeps its price. Not persisted across reloads (no persistence in v1).
- Core: `calc/price.ts` (`lineCost`, `costTotal`), form layer `form/price.ts` (`pricing`), outside `calculate`.

## Consequences
- A price per sheet, per fitting, labour or a price list per supplier are not modelled; each is a later, separate decision.
- Currency is UAH only (target market Ukraine).
- If the order margin should also apply to insulation, it is one change in `pricing` and this ADR is superseded.
