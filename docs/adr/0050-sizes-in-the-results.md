# 0050. Sizes in the results rows

Status: Accepted
Date: 2026-11-19
Source: owner (Nikita): after cloning a fitting and changing the copy, the two results rows looked the same

## Context
A results row showed only the position and the kind («19. ПКХ — ...»). Two rows of one kind with different sizes could not be told apart, nor found in the card list.

## Decision
Each results row shows a short size line under the name, with the sketch letters (ADR 0034): «a₁×b₁ 600×300 · d₂ 200», «d₁ 250 · R 250 · α 90°», «a₁×b₁ 400×200 · L 1000». Width and height go as a pair; branches use the small-end letters; the allowance and form-only fields (max piece) are left out, an empty optional field (reducer length) too, an empty required one shows «–» (`sizeLabel` in `components/calculator/format.ts`). The name is a button: a click scrolls to the fitting card.

## Consequences
Rows are taller by one small line. The custom position (ADR 0049) remains the way to name rows explicitly.
