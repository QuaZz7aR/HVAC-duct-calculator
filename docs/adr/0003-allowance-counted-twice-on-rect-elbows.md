# 0003. Allowance counted twice on rect elbows

- Status: Accepted (deviation from the Excel, confirmed by the engineer)
- Date: 2026-10-07
- Source: engineer answer of 2026-10-07 ([log](../engineer-answers.md#answers-of-2026-10-07)); PR #9

## Context
`allowance` is extra wall length added at manufacture so there is room to attach flanges. Excel (`M8`) adds the connection allowance once for rect elbows, our fixtures twice.

## Decision
The allowance counts x2 for rect elbows too, like round elbows. Confirmed by the engineer: the Excel is wrong here and our value is right.

## Consequences
- Area is +9.6 % (350x150) and +13.7 % (400x200) against the Excel.
- This deviation had no code `TODO(confirm)`, only the note; it is closed.
