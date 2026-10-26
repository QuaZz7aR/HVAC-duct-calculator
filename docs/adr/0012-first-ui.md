# 0012. First UI: one client page over the pure core

- Status: Accepted; the loss parts are hidden since 2026-10-19 ([0027](0027-pressure-losses-hidden-in-the-ui.md)), the system-font rule is superseded by [0030](0030-beta-start-state-and-card-view.md)
- Date: 2026-10-08; split into components 2026-10-09
- Source: project decision; PR #8, #10, #13

## Context
The first version had to be deployable on Vercel with no backend.

## Decision
- One client page (later split into small components under `src/components/calculator/` with state in the `useCalculator` hook, no behaviour change), all calculation in the browser over the pure core, no backend, no persistence, no new dependencies.
- Language is Ukrainian; all strings are in `src/lib/i18n/uk.ts`, fitting names use the Excel designations.
- Form fields are raw text (decimal comma accepted); text is parsed in `form/calculate.ts`, validated by the existing Zod schemas, and errors are shown as the dictionary message for the stable code.
- Fitting and quantity (positive integer, code `quantity.invalid`) are validated by `sheetListItemSchema`; flow, zeta and air are still checked in `form/`.
- Empty zeta means 0; empty reducer length means the config default.
- The page total of pressure drop is the plain sum of quantity times section loss, valid for one serial path only (labelled so).
- Rows with errors are left out of totals and counted.
- Fonts are the system stack (no Google Fonts, no network at build).

## Consequences
- Fonts: since 2026-10-22 the cards use IBM Plex through `next/font/google` ([0030](0030-beta-start-state-and-card-view.md)).
- Deferred: Russian/English dictionaries, no list persistence, no per-system grouping (`docs/decisions.md`, Deferred).
