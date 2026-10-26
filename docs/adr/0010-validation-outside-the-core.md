# 0010. Validation outside the core, stable error codes

- Status: Accepted
- Date: 2026-10-08 (stage 1)
- Source: project decision; PR #4, #5

## Context
The core in `src/lib/calc/` is plain TS with no framework imports and no Zod.

## Decision
- **Validation** is Zod 4 in `src/lib/validation/`, outside the core. It reports stable error codes, not text. A reducer length below the floor is an error, never clamped.
- **`assembleSection`** throws on non-positive flow and negative local coefficient; the validation layer reports the same cases as codes.

## Consequences
Text for every code lives in the dictionary (`i18n/uk.ts`, `form/messages.ts`).
