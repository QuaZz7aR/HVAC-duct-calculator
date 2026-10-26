# 0020. Input warnings, never errors

- Status: Accepted (thresholds partly `TODO(confirm)`)
- Date: 2026-10-16
- Source: engineer answers of 2026-10-16 and 2.3 of 2026-10-19 ([log](../engineer-answers.md)); ДБН В.2.5-67:2013, додаток Ц; PR #16

## Context
The engineer said: warn, do not auto-scale. A side 2.5-3x the other is not done in practice.

## Decision
**Input warnings** (`calc/warnings.ts`, thresholds in `config.warnings`): non-blocking advice for a valid fitting, never an error and never a change of the typed sizes.
- Rect aspect ratio >= 3 -> warning (engineer: a side 2.5-3x the other is not done in practice); > 6.3 -> strong warning that replaces the plain one (ДБН В.2.5-67:2013, додаток Ц limit).
- Any cross-section dimension > 2000 mm -> warning that the thickness must be justified by calculation (same appendix).
- Elbow inner radius > 2 x width (rect) or diameter (round, inner = center - D/2) -> warning, threshold is `TODO(confirm)`.
- `calculate` attaches `warnings` to every row that calculated; the UI shows them under the row card (amber, strong in red). Rows with errors show only the errors.

## Consequences
- Elbow radius threshold: the engineer expected inner radii of 50 mm, 100-150 mm for big ducts; 2 x width is preliminary. On 2026-10-19 he did not remember (3.3); it stays preliminary.
- The aspect ratio threshold 3 was chosen from his "2.5-3" and ДБН 6.3; to confirm.
- 2026-10-19 (2.3): "some warning, need context"; the warnings stay as decided on 2026-10-16.
- Tees and crosses add `branch.larger` ([0021](0021-tees-and-crosses.md)).
