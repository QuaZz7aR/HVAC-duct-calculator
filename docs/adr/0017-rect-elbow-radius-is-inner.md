# 0017. Rect elbow radius is the inner radius

- Status: Accepted
- Date: 2026-10-16 (Ш1)
- Source: engineer answer Ш1 of 2026-10-16 ([log](../engineer-answers.md#answers-of-2026-10-16-sheet-шаблон)); PR #16

## Context
It was open whether the rect elbow radius in the Excel is the inner or the centre-line radius.

## Decision
**Rect elbow radius is inner.** His construction is an annular sector: area of the big circle minus the small one of the inner radius, cut by the angle. Our `perimeter x (arc on the axis + 2 x allowance)` with `center = innerRadius + width / 2` is the same geometry.

## Consequences
The rect elbow field is `innerRadius`, the round one `centerRadius`; sketches and the elbow radius suggestion follow this ([0028](0028-elbow-radius-suggested-from-the-size.md), [0029](0029-fitting-sketches.md)).
