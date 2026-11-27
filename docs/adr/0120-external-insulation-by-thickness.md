# 0120. External insulation by thickness, no material

- Status: Accepted
- Date: 2026-11-27
- Source: owner, 2026-11-27, after a talk with the engineer's friend ("write simply «external insulation» and its thickness instead of izolon, rubber, mineral wool; the calculation is the same, the user decides which insulation to order")

## Context
ADR 0037 let the user pick one of six materials from the engineer's Excel (Ізолон 8, каучук 10 / 13 / 30, мін. вата 30 / 50). The area depends only on the layer thickness, so the material name added nothing and limited the thickness to six values.

## Decision
- The card field is «Зовнішній утеплювач, мм» (en «External insulation, mm»): a number input, empty = not insulated (placeholder «без утеплення»), valid 0 < t ≤ 200 mm (`maxInsulationMm`), decimal comma allowed. Outside that range: `insulation.unknown`, «Товщина утеплювача: більше 0, до 200 мм».
- `FormRow.insulation` holds the typed thickness. The row's material is `{ code: 'ext<t>', thicknessMm: t }` (`insulationMaterial`, `externalCode` in `form/calculate.ts`); the list has one line per thickness, thinnest first, named «Зовнішній утеплювач t мм» (`dict.insulation.name`, `insulationName` in `format.ts`); prices are keyed by `ext<t>`.
- The area model of ADR 0037 is unchanged (`calc/insulation.ts` untouched).
- Compatibility: `config.insulation.materials` stays, and a legacy code (`kf13`, ...) is still accepted by `calculate` (older tests). A saved project is migrated on read: a legacy code becomes its thickness, a legacy price moves to `ext<t>` (two codes of one thickness, kf30 and mf30: the first price wins). The import never set insulation, so it is not affected.

## Consequences
- Two old materials of one thickness (каучук 30 and мін. вата 30) now make one line.
- Only the Ukrainian / English names of the six materials were removed from the dictionaries.
