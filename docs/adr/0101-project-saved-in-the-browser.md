# 0101. The project is saved in the browser

Status: Accepted
Date: 2026-11-24
Source: Nikita, 2026-11-24: "сначала сохранение проекта в браузере", so the fittings and prices do not vanish on a reload. Lifts "no persistence in v1" for the browser only (no server, no accounts).

## Context
Everything typed was lost on a reload: rows, order, positions, settings and prices (ADR 0038: "not persisted"). The language, theme and mode were already remembered in `localStorage` (ADRs 0039, 0082, 0092).

## Decision
- One `localStorage` key `project` holds JSON `{ version: 1, rows, settings, prices }` (`form/project-store.ts`: `serializeProject`, `parseProject`). Rows keep their order, ids, values, quantity, allowance count, insulation, positions, typed-over fields and import marks; the hidden `flow` / `zeta` are not kept. Mode, language and theme keep their own keys.
- Written 300 ms after the last change. Read once right after hydration: the server and the first client render show the sample rows (ADR 0030), then the saved project replaces them. The beta sample rows show only when nothing is saved; an emptied list («Видалити всі») stays empty after a reload, which is also the way to start over.
- Safe loading: bad JSON, another version or a non-array `rows` = nothing saved (sample rows). In a readable project a row with an unknown kind or a bad id is skipped, a repeated id keeps the first, values of fields the kind does not have are dropped, missing ones take the kind's initial value, a bad setting or price takes its default. A blocked or full storage only stops saving.
- A future change of the shape raises `projectVersion` and adds a reader for the old version.

## Consequences
- Supersedes the "not persisted" line of ADR 0038; prices are kept with the project.
- One project per browser; several named projects, a file export / import of the project and sync between devices are deferred.
