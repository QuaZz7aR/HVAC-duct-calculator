# 0041. Engineer's table keys rect by the equivalent diameter; number of allowances per fitting

- Status: Accepted. Supersedes the larger-side key of [0007](0007-engineer-thickness-table.md) and makes the fixed x2 of [0003](0003-allowance-counted-twice-on-rect-elbows.md) a per-fitting default.
- Date: 2026-11-16
- Source: engineer answers of 2026-11-16, items 1 and 4 ([log](../engineer-answers.md#answers-of-2026-11-16)), after the check against his three orders (`reports/engineer-tables-check-2026-11-12.md` in the project files)

## Context
The check against the engineer's practice-proven orders showed two systematic differences. His template and orders take the thickness of rect parts by the equivalent diameter 2AB/(A+B); our option `engineerThickness` used the larger side (ADR 0007), so the sheet list by thickness differed most. His tables count the allowance of rect elbows once, ours twice (ADR 0003); in practice a fitting can have a flange at both, one or no ends.

## Decision
- **Thickness**: `ThicknessTable.rectKey` says what keys a rect size: `largerSide` (ДБН, the default table, unchanged) or `equivalentDiameter` (the engineer's table, `engineer-2`). Round sizes are keyed by the diameter in both. Which size of a fitting keys the lookup (`thicknessSize`: main duct of tees, larger ends of reducers, rect end of rect-to-round) is unchanged.
- **Number of allowances**: every fitting with an `allowance` (elbows, reducers, rect-to-round, tees and crosses) takes an optional `allowanceCount` 2, 1 or 0, absent = 2, so every existing value stays as it was. The developed length gets `allowanceCount x allowance`. On tees and crosses it counts the ends of the main run; the branch collar length stays `allowance` (`TODO(confirm)`). The card has a select «Кількість припусків» 2 / 1 / 0 for these kinds, default 2.

## Consequences
- With the engineer's table, rect parts from 400 mm on the larger side but under 400 mm of equivalent diameter (e.g. 500 x 200, 300 x 400) now get 0.55 instead of 0.7; the ДБН default is not affected.
- `centerlineLength` never depends on the allowance count. Insulation follows the metal developed length, so a lower count also lowers the insulated length, as before with the allowance itself.
- Open: the engineer's Пвр (rect tap) seems keyed by its width only in his tables; not followed, a tap is keyed like any rect size. Asked the owner.
