# 0034. Latin letters for sizes on the sketch and in the field labels

- Status: Accepted
- Date: 2026-10-27
- Source: the owner (2026-10-27): "switch all designations to Latin, look up how these quantities are usually denoted, and add the letter to the label of the matching input"; then "a pair a₁ a₂ is better than a a₁"

## Context
The isometric sketch ([0033](0033-isometric-sketch.md)) marked sizes with Cyrillic initials (Д, Ш, В, д, ш, в), and the field labels named the size without a letter, so the user had to match a letter on the drawing to a field by its word. Drawings and duct catalogues use Latin letters. EN 1505 (rectangular ducts) and EN 1506 (circular ducts) define the dimension symbols of fittings; catalogues built on them (for example Lindab) give a rect duct as a × b with a the larger side, a taper as a × b to c × d, and a round duct by its diameter d. The full symbol tables of the standards were not available to check.

## Decision
- One set of letters in `dict.symbols` (`src/lib/i18n/uk.ts`), used by the field labels, the sketch legend and the isometric sketch:
  - d₁: diameter; a₁: width; b₁: height of the main size (the only size of a straight duct, elbow, cap or tap).
  - d₂, a₂, b₂: the small end of a reducer or the branch of a tee or cross. A pair of indices instead of the catalogues' c × d, because d is already the diameter (owner, 2026-10-27: "a pair a₁ a₂ is better than a a₁").
  - The fields are shared by all kinds, so a straight duct reads a₁ × b₁ too.
  - L: length (the duct, the reducer or the tap stub); R: elbow radius (centre-line for round, inner for rect, as the field says); α: angle.
  - p: allowance. There is no common letter for it; p (припуск) is the project's choice.
  - n: quantity.
- Field labels carry the letter after the name: «Діаметр d₁, мм», «Мала ширина a₂, мм», «Ширина врізки a₂ (вздовж осі), мм», «Кут α, °».
- Fitting designations (КВ, ПВ, КО ...) stay as in the engineer's Excel.

## Consequences
The legend under the isometric sketch reads "a₁ — ширина, b₁ — висота" and so on. The side view and cross-section, which are not shown on the card since 0033, keep their Cyrillic letters; switch them to `dict.symbols` if they come back. If the engineer prefers other letters (for example c × d for the small end, plain a × b for a single size, or another letter for the allowance), only `dict.symbols` changes.
