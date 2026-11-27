# 0120. Cladding over the insulation of outdoor ducts (beta)

- Status: Accepted
- Date: 2026-11-27
- Source: the engineer's friend via the owner (2026-11-27): outdoor ducts need an extra cladding over the insulation

## Context
Ducts on a roof or a facade are insulated and then clad with a sheet (galvanised steel, aluminium, stainless) that protects the layer from weather. The order needs the cladding area beside the insulation area. No norm or practice gave an overlap for the cladding seams yet.

## Decision
- A row with an insulation material gets the choice «Обшивка поверх утеплення» Ні / Так (`FormRow.cladding` = '1' or empty, off by default), advanced mode only (`adv-only`, shown when the row has an error on it). Cladding without insulation is the error `cladding.noInsulation`.
- `calc/insulation.ts` `claddingArea(f, t, config)` = `insulationArea(f, t, config)` x (1 + `config.cladding.overlapPercent` / 100): the cladding lies on the outer surface of the layer, so it reuses the same geometry (sizes + 2t, elbows with the cutting coefficient, caps the end plate only). `overlapPercent` = 0, `TODO(confirm)`.
- The result carries `RowResult.cladding` and `Calculation.totalCladdingArea`. The cladding is one line under the insulation list (area, one price per m², cost), a line in «Разом» and in the export (specification totals, the insulation sheet). The price is `PriceText.cladding`, counted in the total and in the unpriced lines like the others. The sheet material and thickness are the user's choice and not modelled, as with the generic insulation.
- The project store saves `cladding` per row and the cladding price.

## Consequences
- Metal, the sheet list and the insulation area are unchanged.
- Open: the overlap of the cladding sheets, whether the cladding should go to the metal list by its own thickness, and per-material cladding lines.
