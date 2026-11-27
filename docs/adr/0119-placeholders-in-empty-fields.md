# 0119. Placeholders in empty optional fields; a clearer short-reducer message

- Status: Accepted
- Date: 2026-11-27
- Source: the engineer via the owner (2026-11-27): empty fields with nothing in them are better avoided; the owner typed «300(recomended)» into the reducer length and got «Введіть число»

## Context
The optional reducer length showed its default only in the label («необов’язково: 300»), the input itself was blank. The new optional «Ø магістралі» of a tap (ADR 0118) was blank too. The `reducer.tooShort` text («менша за мінімально допустиму») did not say what the minimum is.

## Decision
- An optional field shows a grey placeholder in the input: the reducer length «300 (рекомендовано)» (`dict.recommendedValue(defaultConfig.reducerLengthMm)`), the tap main diameter «пласка стінка». The label keeps only «(необов’язково)». A placeholder is never a value: an empty field still means the default.
- `reducer.tooShort` names the floor and the recommended length: «Довжина переходу менша за 150 мм … Введіть 150 мм або більше (рекомендовано 300).» The numbers are in the dictionary text (the floor is `config.reducerMinLengthMm` = 150; change both together).

## Consequences
UI text only, no calculation changes. Required fields keep no placeholder: they get the kind's preset values when a row is added.
