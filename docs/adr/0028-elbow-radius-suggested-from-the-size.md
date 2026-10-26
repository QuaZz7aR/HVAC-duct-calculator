# 0028. Elbow radius suggested from the size

- Status: Accepted (values `TODO(confirm)`)
- Date: 2026-10-22
- Source: engineer UI advice (2026-10-22); PR #24

## Context
The engineer asked for editable inputs everywhere, with defaults that scale with the part size.

## Decision
The form now suggests the elbow radius (`config.elbowRadius`, form layer only; the core, fixtures and validation are unchanged):
- Round elbow: centre-line radius = 1.0 x D. Rect elbow: inner radius = 0.5 x W (W = the bend-plane side), i.e. centre-line R = 1.0 x W. For W 100-300 mm this gives 50-150 mm, in line with what the engineer expected.
- The field follows the size until the user types in it; after that it is never overwritten. Clearing the field keeps it empty (so it can be retyped); "скинути до авто" hands it back. A kind change resets it. No valid size yet: the field stays empty.

## Consequences
- `TODO(confirm)`: common practice (round R = D in manufacturer catalogues and our fixtures; rect R/W >= 1.0 without vanes in SMACNA-style specs), not a norm. No radius rule was found in ДБН В.2.5-67:2013 or EN 1505/1506 in open sources. To ask the engineer: are R = D and inner 0.5 x W the typical values. Sources seen: Lindab Safe catalogue (BFU 90 bend, centre-line R about 1 x d), SMACNA-style project specs (R/W 1.0-1.5; 0.5 only with vanes).
- Deferred: air block back in the UI (with the aerodynamics mode; pressure kPa / atm conversion then).
