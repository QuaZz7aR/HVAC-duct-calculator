# 0022. User-set seam allowance for the non-elbow kinds

- Status: Accepted
- Date: 2026-10-19 (2.1)
- Source: engineer answer 2.1 of 2026-10-19 ([log](../engineer-answers.md#answers-of-2026-10-19-informal-the-engineer-is-unsure-on-several)); PR #20

## Context
The engineer does not remember what the coefficients 1.15 / 1.2 / 1.1 were for; "if it is for seams (фальц), then for all elements". His own real specification has no coefficient on straight ducts.

## Decision
The coefficients stay for elbows only ([0016](0016-waste-factor-for-elbows-only.md)) and every other kind gets a user-set **seam allowance** ("запас на фальц", %, default 0): `wasteFactor.default = 1 + percent / 100`, in the settings block of the UI. The user decides; nothing is added by default.

## Consequences
- Taps use it too ([0026](0026-branch-in-taps.md)).
- A bad value in the settings is reported and keeps the default (`form/settings.ts`).
