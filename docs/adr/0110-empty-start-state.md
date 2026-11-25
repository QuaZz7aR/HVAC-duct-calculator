# 0110. A new project starts empty

- Status: Accepted
- Date: 2026-11-25
- Source: owner (2026-11-25: "можно убирать добавление всех деталей из беты при загрузке страницы")

## Context
During the beta the page opened with one example row of every fitting kind ([0030](0030-beta-start-state-and-card-view.md), `form/sample-rows.ts`), so visitors saw all 19 kinds at once. The project is now saved in the browser ([0101](0101-project-saved-in-the-browser.md)), import and the how-to are in, and the example rows only get in the way of a real project.

## Decision
- `useCalculator` starts with no rows. A project saved in `localStorage` still loads as it is; «Видалити всі» leaves an empty project, which is saved as such.
- An empty list shows a dashed «Проєкт порожній» box: on desktop it points to the rail («Додати деталь»), the rail's «Імпорт» and «Як користуватися»; on the phone to the round «+», the «☰» menu and the «?» button (`dict.emptyList`, uk and en).
- `sampleRows` stays as test data and for the README screenshots (seed the `project` key with them); it is no longer used by the page.
- `scripts/record-help.cjs` clears the list only when there is something to clear.

## Consequences
- Supersedes the beta start state part of [0030](0030-beta-start-state-and-card-view.md); the rest of 0030 stands.
- Visitors who already have a saved project see no change.
