# 0113. Adapters / boxes and offsets («утки») as a beta

- Status: Accepted (beta)
- Date: 2026-11-26
- Source: owner (2026-11-26: «давай делать адаптеры и короб, пометим как бета-версию расчета этих деталей, высчитываем по формулам из открытых источников ... также знакомые просили добавить расчет "утки"»); the engineer's template «Адаптор» row; ДСТУ Б Д.2.4-15:2014 п. 3.5.2 (area = perimeter x length); the engineer's real specification (Квартира, Київ, 2021) for the check

## Context
Adapters, boxes and offsets were out of scope for v1 (`CLAUDE.md`): the engineer said he does not compute offsets, and the letter of 2026-10-23 asking for his adapter rules is unanswered. They are about 18 % of the area of his real specification (15 adapters / boxes, 4 offsets), and acquaintances asked for offsets. The owner chose a beta from open formulas over waiting.

## Decision
Three new kinds, marked «(бета)» in their names (uk and en) and listed in their own rail group «Адаптери, утки (бета)» (`betaKinds` in `form/fields.ts`):
- **ПА `rectBox`** (adapter / box): width a, height b, length L, closed ends 0 / 1 / 2 (prefill 2), inner partitions n (prefill 0). Area `2(a + b) L + (ends + n) a b`; with two ends and no partitions it is the template's «Адаптор» `2(AB + AL + BL)`. No allowance, no cutting coefficient. Spigots and taps are separate Квр / Пвр rows (the template's `2 pi E G` term is a tap without its ring). Thickness by a x b; centre line = L (`TODO(confirm)`).
- **ПУ `rectOffset`** (rect offset): a x b, axial length L, offset H along side a, allowance p with 2 / 1 / 0 ends. The two walls in the offset plane are flat parallelograms a x L; the other two run along the straight slant `sqrt(L^2 + H^2)`. Area `2 a L + 2 b sqrt(L^2 + H^2) + 2(a + b) x count x p`. `developedLength` is the area-equivalent length (area / perimeter), as for `rectReducer`. This reproduces all four offsets of the engineer's specification to the hundredth (0.56, 0.50, 0.39, 0.21 m²) with p = 50, a = the first size of the name.
- **КУ `roundOffset`** (round offset): `pi d (sqrt(L^2 + H^2) + count x p)`, the oblique end cuts ignored; a smooth slanted tube, not two segmented elbows (`TODO(confirm)`).
- Offsets and boxes have no waste factor other than the user's seam allowance, consumption = actual area, insulation by the usual + 2t rule.
- Import: recognised by the codes ПА, ПУ, КУ (RA, RO, CO); an offset's «подъем / підйом / зміщення на N мм» in the name fills H. Recognition by the words «утка», «короб», «адаптер» is **not** switched on: two existing import tests pin those names as not recognised, and tests are changed only by the owner. A ready patch for that is offered separately.
- The sketch of all three is the straight piece for now.

## Consequences
- Lifts «Offsets ("utka"), adapters/boxes» from the out-of-scope list in `CLAUDE.md`; refines [0061](0061-import-from-excel.md) (codes only).
- Slot-diffuser adapters with one open side (Kyiv поз. 32-36) are not modelled: our closed box with partitions gives 2.06 m² against his 1.6. A per-side «open face» option waits for the engineer's answer to the 2026-10-23 letter.
- Fixtures `box-offset.fixtures.ts` come from the owner (patch in `/mnt/project-files/box-offset/`).
