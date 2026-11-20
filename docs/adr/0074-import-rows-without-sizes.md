# 0074. Imported rows without sizes are added with a warning

Status: Accepted
Date: 2026-11-20
Source: owner, 2026-11-20 (a school spec has «окожушка» and «Кругла заглушка» rows with no sizes)

## Context
A spec row can name a fitting (or get a kind chosen by hand in the import preview) without giving any size. Adding it silently leaves an empty card that is easy to miss.

## Decision
`toFormRows` marks a row whose file gave no value for any of its fields with `FormRow.noSizes`. The card shows «⚠ розмірів у файлі немає: введіть їх, до того деталь не рахується», the folded tile a short «⚠ розмірів у файлі немає». The empty fields fail validation as usual, so the row is not counted. The mark goes away on the first edit of any field or on a kind change.

## Consequences
Nothing is skipped or filled in for the user; the rows stay visible until someone types the sizes or deletes them.
