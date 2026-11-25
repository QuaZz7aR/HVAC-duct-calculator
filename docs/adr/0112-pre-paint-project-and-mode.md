# 0112. Pre-paint check of the saved project and the mode

- Status: Accepted (refines 0111)
- Date: 2026-11-25
- Source: owner (2026-11-25: the page still flashes, even with an empty project)

## Context
[0111](0111-no-flash-before-the-saved-project.md) hid the list and the results until hydration for every visitor, so an empty project flashed from hidden to shown, and a stored advanced mode still popped its blocks in after hydration (`<html data-mode="simple">` from the server).

## Decision
`preloadScript` (`form/theme.ts`) runs before paint next to the theme script: it puts the stored mode on `<html data-mode>` and, when the saved project has rows, `<html data-project="rows">`. CSS hides `.project-wait` (the list, export bar, results and totals) only while `data-project="rows"` is set and `data-loaded` is not; `useCalculator` sets `data-loaded` in a layout effect once the project is read. An empty or new project renders at once with no hiding.

## Consequences
- No flash for an empty project, a saved one or the advanced mode.
- The script reads the `project` and `mode` keys directly; renaming them means changing it too.
