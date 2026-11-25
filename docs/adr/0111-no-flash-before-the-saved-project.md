# 0111. No flash of the empty project before the saved one

- Status: Accepted; refined by [0112](0112-pre-paint-project-and-mode.md)
- Date: 2026-11-25
- Source: owner (2026-11-25: on reload the empty project shows first, then the saved one)

## Context
The saved project is read from `localStorage` right after hydration ([0101](0101-project-saved-in-the-browser.md)). With the empty start state ([0110](0110-empty-start-state.md)) the server render and the first client render showed «Проєкт порожній» and zero totals, so a reload flashed the empty project.

## Decision
`useCalculator` returns `loaded`; until it is true the list, the export bar, the results and the totals are rendered `invisible` (layout kept, `aria-busy`). The header, the rail and the mode bar show at once.

## Consequences
- No flash on reload; a first visit sees the empty hint a moment after hydration.
