# 0079. A hood (зонт) is imported as a cap

Status: Accepted
Date: 2026-11-20
Source: owner, 2026-11-20 ("распознаем зонты как заглушку"); check `reports/specs-recheck-2026-11-20.md`

## Context
The АКБ order lists kitchen hoods («Зонт острівний 810х350х300н + врізка д200», 24 % of its area) under the code ПП with only A and B, so the import made a rect reducer that failed validation. The engineer's template computes them as lid + rim, A·B + perimeter·L, which is exactly our rect cap (810 × 350 × 300 = 0.9795 m² in both). ADR 0061 listed «зонт» among the parts we never match.

## Decision
A name with «зонт», «парасолька» or «hood» is a cap (round or rect by the sizes in the name), and the name wins over the code cell. The rim height comes from the L column, as for any cap. The branch stub in the hood is not counted, as in the template.

## Consequences
The АКБ hoods import and match the order to 0.0 %. ADR 0061 is unchanged except that «зонт» is no longer in its list of parts we do not compute.
