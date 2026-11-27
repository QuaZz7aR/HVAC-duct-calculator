# 0120. Equipment: casing insulation only, apart from the fittings

- Status: Accepted (beta; formula and prefills `TODO(confirm)`)
- Date: 2026-11-27
- Source: the engineer's friend via the owner (2026-11-27): «добавить позицию "оборудование" с габаритами и отверстиями (в основном 2 или 4), выделить его отдельно от обычных деталей исключительно для расчета утеплителя соответственно его габаритам»; reference: air handling unit, duct heater / fan / cooler

## Context
Air handling units, duct heaters, fans and coolers are insulated on site together with the ducts, but no metal is made for them. The calculator had no place for them: a box (ПА) would add metal and a thickness.

## Decision
- A new core type `Equipment` (`calc/equipment.ts`): outer casing length x width x height and a list of duct openings, each round (Ø) or rect (a x b). It is not a `Fitting`: no metal area, thickness, sheet list or pressure drop.
- Insulation area of one piece = the outer surface of the layer, each of the three sizes + 2t (as on the ducts, ADR 0037): `2(lw + lh + wh)` minus the openings at their own size (`equipmentInsulationArea`). Openings that leave no area are the error `equipment.openings`.
  `TODO(confirm)`: whether to subtract the opening at its own size or with the duct's insulation (d + 2t); the casing's real shape (feet, service panels) is ignored.
- Validation: `equipmentItemSchema` (`{ equipment, quantity }`) in `validation/schemas.ts`, the same size and quantity codes as the fittings.
- Form: `form/equipment.ts` - `EquipmentRow` (name, sizes, openings, quantity, material as text), `calculateEquipmentRow`, `addEquipment(calc, rows, config)` adds the outcomes to `Calculation.equipment` and its insulation to `insulationList` and `totalInsulationArea`, so the insulation list, its price and the totals include it. Prefills (`TODO(confirm)`): 1500 x 800 x 600 mm, two rect openings 400 x 300, the first material of the list.
- UI: an «Обладнання (бета)» block under the fittings list in a dashed neutral frame (`.equipment-block`), its own cards with «+ Додати обладнання», «+ Додати отвір» and the area per card. Advanced mode only, like the insulation it feeds (ADR 0082); hidden rows still count. Not in the rail, the results table or the sections: it is not a fitting.
- Saved with the project (`SavedProject.equipment`, same version: older projects read as no equipment), listed in the Excel export under the fittings with the insulation column only.

## Consequences
- The insulation list and its cost can now differ from the sum of the results table: the difference is the equipment.
- The import does not recognise equipment rows yet (deferred).
