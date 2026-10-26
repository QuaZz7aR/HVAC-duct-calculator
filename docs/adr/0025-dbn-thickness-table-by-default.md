# 0025. ДБН thickness table by default

- Status: Accepted; supersedes [0007](0007-engineer-thickness-table.md) as the default
- Date: 2026-10-19 (3.4)
- Source: engineer answer 3.4 of 2026-10-19 ("do it by ДБН", [log](../engineer-answers.md#answers-of-2026-10-19-informal-the-engineer-is-unsure-on-several)); ДБН В.2.5-67:2013, додаток Ц; PR #20

## Context
The ДБН thickness table (ДБН В.2.5-67:2013, додаток Ц) differs from the engineer's: rect 0.5 (up to 250) / 0.7 (300-1000) / 0.9 (1250-2000), round 0.5 / 0.6 / 0.7 / 1.0 / 1.2 / 1.4 by diameter, "not more than"; no 0.55; above 2000 by calculation; fire-resistant at least 0.8.

## Decision
- `dbnThickness` is the default table (`config.ts`): round by diameter up to 200 -> 0.5, 250-450 -> 0.6, 500-800 -> 0.7, 900-1250 -> 1.0, 1400-1600 -> 1.2, 1800-2000 -> 1.4; rect by the larger side up to 250 -> 0.5, 300-1000 -> 0.7, 1250-2000 -> 0.9.
- The norm lists only some sizes, so a size in between takes the next larger listed one (the safe side): 201-450 -> 0.6, 1001-2000 rect -> 0.9 (`TODO(confirm)`, our rule). The table uses `bandStart: 'exclusive'` ([0008](0008-versioned-band-tables.md)).
- Above 2000 mm the thickness is by calculation: the last band is used and the `size.overLimit` warning fires.
- Fire-resistant ducts (at least 0.8 mm, п. 7.11.5) are not modelled.
- The engineer's 0.55 / 0.7 table stays as `engineerThickness`, selectable in the UI.

## Consequences
- This changes the thickness of most rows against the earlier default.
- Deferred: "a custom table maybe later" (a user-defined thickness table), fire-resistant ducts as a mode.
