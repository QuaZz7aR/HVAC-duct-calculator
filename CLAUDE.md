@AGENTS.md

# HVAC duct calculator

Web tool: list of duct fittings -> sheet-metal area, insulation area, pressure drop per section.
Reference implementation is a practising engineer's Excel; verified numbers live in the fixtures.
Stack: Next.js (App Router), TypeScript strict, Vitest, Zod 4. Core logic is plain TS in `src/lib/calc/`, no framework imports and no Zod. Input validation lives in `src/lib/validation/` and wraps the core.
Engineering decisions, the `TODO(confirm)` register and deferred work: `docs/decisions.md`.

## Status
Stage 0 (fittings geometry, pressure drop) and stage 1 core (thickness table, elbow waste factor, air properties, Zod validation, `assembleSection`) are done and merged. Sheet list by thickness (metal m2 per thickness, `sheetList`) is done. First UI is done (split into focused components + `useCalculator` hook): one client-side calculator page (Ukrainian), no backend. Next: connect the repo to Vercel (owner's account), XLSX export.

## Code map (`src/lib/`)
- `calc/units.ts` - `mmToM`, `m3hToM3s`, `degToRad`; the only place that converts.
- `calc/config.ts` - `CalcConfig` and `defaultConfig`: roughness, reducer length and floor, air constants, thickness table, waste-factor table.
- `calc/sheet-area.ts` - `developedLength`, `sheetArea` (pure geometry, no waste), `centerlineLength`.
- `calc/waste-factor.ts` - `wasteFactor` (elbows only, other kinds use `table.default`), `metalArea = sheetArea * wasteFactor`.
- `calc/thickness.ts` - `thickness(size, config)` lookup; `thicknessSize(fitting)` picks the size that keys it (reducers: larger end, rect-to-round: the rect end, as in the Excel).
- `calc/sheet-list.ts` - `sheetList([{ fitting, quantity }], config)` -> `[{ thicknessMm, area }]` ascending thickness, area in m2 with waste factor times quantity. No sheet count (see decisions.md).
- `calc/air.ts` - `airAtConditions(tC, pPa, config)` -> density, kinematic viscosity.
- `calc/aero.ts` - `pressureDrop` (straight section), `pressureDropAt`, `roundOpening` / `rectOpening`.
- `calc/section.ts` - `assembleSection({ fitting, flow, localCoefficient }, air, config)` -> `metalArea` (m2), `centerlineLength` (m), `pressureDrop`.
- `form/` - the layer between the UI and the core (plain TS, tested): `fields.ts` (`kindFields`: which inputs each kind has, form prefills, `FormRow` of raw text), `calculate.ts` (`calculate(rows, airText, config)`: text -> Zod validation -> `assembleSection` / `sheetList`, per-row outcome, totals), `messages.ts` (`issueMessage`: error code -> text from the dictionary).
- `i18n/uk.ts` - the dictionary: every user-visible string, kind designations (КВ, ПВ, КО, ПО, КП, ПП, ППК, Заглушка) and one message per error code. A new language is one more file with the `Dictionary` shape.
- `src/components/Calculator.tsx` - the page (client component): lays out the blocks, no logic. `src/app/page.tsx` only renders it.
- `src/components/calculator/` - the blocks: `useCalculator.ts` (hook: rows and air state, `calculate`, row actions), `AirParams`, `FittingList` > `FittingCard` (one row), `ResultsTable`, `Totals`, `SheetList`, shared `TextField`, `ErrorList`, `format.ts` (`fmt`, `rowTitle`), `styles.ts` (Tailwind class strings). Components take props only; calculation stays in `src/lib`.
- `validation/` - `createSchemas(config)`, `fittingSchema`, `ductSectionSchema`, `airInputSchema`, `sheetListItemSchema` (`{ fitting, quantity }`), `sheetListSchema` (array of those), `validate`. Errors are stable codes (`codes.ts`), never human text.

## Commands
- `npm ci` - install. Never `npm install` (see Guardrails).
- `npm test` - vitest run. Must be green before any commit.
- `npm run typecheck` - `next typegen && tsc --noEmit`
- `npm run lint`
- CI (`.github/workflows/ci.yml`, job `check`) runs `npm ci`, typecheck, lint, test on Node from `.nvmrc` (24).

## The one rule that matters
`src/lib/calc/__fixtures__/` is the source of truth. **Never change an expected value to make a test pass.**
If you believe a fixture is wrong, stop and show the arithmetic that proves it; I decide, not you.
Never change existing tests or their tolerances (`toBeCloseTo` precision). Never write to `__fixtures__/` or these tests via shell either.
Fixtures with `basis: 'excel'` follow the spreadsheet author's convention and are not independently verified.

## Units
- Boundary (inputs, fixtures, UI): mm, degrees, m3/h.
- Inside the core: SI only (m, m2, m3/s, Pa). Convert in one place, `units.ts`, and nowhere else.
- Use `Math.PI`, never 3.14 / 3.1415.

## Domain rules (decided, do not revisit)
- `developedLength` is computed once per fitting and reused for metal AND insulation. Two copies of the same geometry must be impossible.
- `centerlineLength` (aerodynamics) is pure geometry. Never derive it from area; never affect it with allowance or waste factor.
- `allowance` = extra wall length at each connection, so flanges have somewhere to attach. One field everywhere (elbows, reducers, branches). A flange itself is not modelled.
- Cone area uses the slant height `sqrt(L^2 + ((D1 - D2) / 2)^2)`, not the axial length.
- Cutting-waste factor and similar coefficients live in config (`defaultConfig`), never as literals in function bodies. Their source is unconfirmed: keep a `TODO(confirm)` next to each.
- Sheet thickness is a versioned lookup table (rect: by larger side, round: by diameter), not a formula. Threshold values are placeholders until confirmed.
- Reducer length: default 300 mm, validation floor 150 mm. Never silently clamp what the user typed.
- Pressure drop: Altshul `lambda = 0.11 * (k/d + 68/Re)^0.25`, equivalent diameter `2ab/(a+b)` for rectangles, `dp_friction = lambda * L/d * Pd`, `dp_local = zeta * Pd`. Default roughness 0.1 mm (steel).
- Waste factor applies to elbows only (round: by diameter, rect: by equivalent diameter); every other kind uses the config default 1.0.
- `rectReducer` is exact per-face geometry (`developedLength` is the area-equivalent length). `rectToRoundReducer` is a project approximation (slant from width only). The Excel is a reference, not the truth.
- Reducer sections in `assembleSection` follow the Excel: friction by the larger end's diameter, velocity is the mean of both ends, `dp_local = zeta * Pd` at that mean velocity (`TODO(confirm)`, handbooks use the small section).

## Guardrails in `.claude/settings.json`
- `Edit`/`Write` are denied for `**/*.fixtures.ts`, `**/__fixtures__/pending/**`, `__tests__/sheet-area.test.ts` and `__tests__/aero.test.ts`. The other tests are not blocked by the harness but the "one rule" still applies to them.
- `npm install` and its aliases, `add`, `update`, `uninstall`, `audit fix`, `dedupe`, `prune`, `link` (and `pnpm`/`yarn` equivalents) are denied for the agent. On Windows they prune Linux-only `@emnapi/*` entries from `package-lock.json` and break CI `npm ci`. Use `npm ci`. Dependencies are added by Linux threads (and only after asking).
- A `Stop` hook (`.claude/hooks/stop-check.mjs`, plain node, cross-platform) runs typecheck, lint and tests when the agent finishes and blocks the stop with the output if any fail. It is skipped when `git status` shows no changes under `src/` or in package/tsconfig/eslint config. Work already committed in the same session is not re-checked. After one blocked retry it only reports, to avoid loops.

## Naming and style
- camelCase for values, PascalCase for types, discriminated unions on `kind`. Short but meaningful names.
- Vocabulary: `width`, `height`, `diameter`, `smallWidth`, `smallHeight`, `smallDiameter`, `centerRadius` (round elbow), `innerRadius` (rect elbow), `angle`, `allowance`, `length`, `area`, `thickness`.
- One comment per formula: what the geometry is, not what the code does.

## Out of scope for v1 - do not implement
Tees and crosses (see `__fixtures__/pending/`), branch-in fittings (round and rect: the "ring" in the Excel formula contradicts the author's definition of allowance), offsets ("utka"), adapters/boxes, flexible duct area, insulation, any persistence or auth.

## Open questions (waiting for the spreadsheet author - do not guess)
1. Rect elbow: is the radius inner or center? The Excel formula treats it as inner; round elbow treats it as center.
2. Tees/crosses: subtract the branch opening from the main duct? Excel does it for one fitting only.
3. What exactly do the cutting coefficients (1.15 / 1.2 / 1.1) cover - waste, seams, both? The engineer only said they were copied from websites as a safety margin.
4. Reducer local loss: which velocity does `zeta` refer to (the Excel uses the mean of both ends)?

Answers the engineer has already given (allowance x2 for rect elbows, reducer length 150 / 300, thickness and flexible-duct roughness as simplifications, ППКр formula bug) are in `docs/decisions.md`, "Engineer answers".

Every `TODO(confirm)` in the code is listed in `docs/decisions.md`.

## Workflow
- `main` is protected: a PR is required (0 approvals), status check `check` must pass, no force push. Never commit to `main`; work on a branch and open a PR. The owner reviews the diff on GitHub and merges.
- Fixtures are written and committed by the owner (short branch + PR). Agents never stage `__fixtures__/`. For a new fixture, draft the values to a file outside the repo and wait.
- Order: type in `types.ts` -> fixture is on `main` -> test red with "not implemented" -> implement -> green -> typecheck and lint -> `/code-review` on the diff -> PR. Open the PR only when `npm test`, typecheck and lint are all green.
- One fitting kind per session. Plan first (plan mode), wait for approval, then implement.
- Never invent a coefficient, a standard or a table. If a source is missing, add a config entry with `TODO(confirm)` and ask.
- No new dependencies without asking. They are added only from Linux, never on Windows.

## Docs stay in sync
Every approved change updates the relevant `.md` files in the same PR: this file (status, code map, rules, open questions), `docs/decisions.md` (new decision, new or resolved `TODO(confirm)`, deferred work). Add a new doc only when it clearly helps an agent understand context, and say why in the PR. A PR that changes behaviour or workflow without touching the docs is incomplete.
