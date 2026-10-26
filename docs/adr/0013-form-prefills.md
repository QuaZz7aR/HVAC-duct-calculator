# 0013. Form prefills are not core defaults

- Status: Accepted
- Date: 2026-10-08
- Source: project decision; PR #8

## Context
The core has no default for `allowance`; the form needs something to start from.

## Decision
**Form prefills** (not core defaults): allowance 50 mm (what the fixtures use) and elbow angle 90, `TODO(confirm)` in `form/fields.ts`.

## Consequences
UI convenience only. Later form defaults follow the same rule: the elbow radius ([0028](0028-elbow-radius-suggested-from-the-size.md)), the tap length 100 mm ([0026](0026-branch-in-taps.md)) and the default sizes per kind ([0031](0031-side-panel-for-adding-fittings.md)).
