@AGENTS.md

# HVAC duct calculator

Web tool: list of duct fittings -> sheet-metal area, insulation area, pressure drop per section.
Reference implementation is a practising engineer's Excel; verified numbers live in the fixtures.
Stack: Next.js (App Router), TypeScript strict, Vitest, Zod 4. Core logic is plain TS in `src/lib/calc/`, no framework imports and no Zod. Input validation lives in `src/lib/validation/` and wraps the core.
Engineering decisions, the `TODO(confirm)` register and deferred work: `docs/decisions.md`.

## Status
Stage 0 (fittings geometry, pressure drop) and stage 1 core (thickness table, elbow waste factor, air properties, Zod validation, `assembleSection`) are done and merged. Sheet list by thickness (metal m2 per thickness, `sheetList`) is done. First UI is done (split into focused components + `useCalculator` hook): one client-side calculator page (Ukrainian), no backend. Deployed on Vercel (owner's account, Hobby plan, auto-deploy from `main`, previews per PR); Vercel Web Analytics is wired in (`<Analytics />` in `src/app/layout.tsx`, package `@vercel/analytics`, the owner enables it in the Vercel dashboard). Elbow radius is now suggested from the size in the form (round centre-line R = 1.0 D, rect inner R = 0.5 W, `config.elbowRadius`, `TODO(confirm)`; the field follows the size until the user types over it). During the beta the page opens with one example row of every fitting kind (`form/sample-rows.ts`) and the sketches open by default. Each fitting card has a "Показати схеми" button that toggles two schematic sketches of its kind, side view and cross-section (inline SVG, labels beside the drawing, a legend under each names the letters). Fittings are added from an always-visible side panel (desktop: sticky rail of kind groups with a list beside it; phone: quick buttons and a bottom sheet with search, see decisions.md "Side panel for adding fittings"); a card shows its kind as a title and changes it through a «⋯» menu. Input warnings (aspect ratio, size over 2000 mm, large elbow radius) are done. Tees and crosses (metal area, 8 kinds, see decisions.md) are done. Standalone branch-in collars (врізки Квр, Пвр: `roundTap`, `rectTap`, metal area only, see decisions.md) are done. The engineer's 2026-10-19 answers are in: ДБН thickness table by default (engineer's table selectable), user-set seam allowance for non-elbows, reducer friction by the mean diameter, order margin (default 20 %), sheet size and sheet count (settings block in the UI). The UI shows areas only (owner, 2026-10-19): pressure losses, centerline length, air parameters, airflow and zeta are hidden, the core and its tests are unchanged. Next, in the engineer's order: insulation, price, aerodynamics as a separate mode; XLSX export waits for the engineer's reference files.

## Code map (`src/lib/`)
- `calc/units.ts` - `mmToM`, `m3hToM3s`, `degToRad`; the only place that converts.
- `calc/config.ts` - `CalcConfig` and `defaultConfig`: roughness, reducer length and floor, air constants, thickness tables (`dbnThickness` default, `engineerThickness` option), waste-factor table (`default` = seam allowance of non-elbows), `order` (margin, sheet size and the offered sizes).
- `calc/sheet-area.ts` - `developedLength`, `sheetArea` (pure geometry, no waste), `centerlineLength`. Tees and crosses (`roundTee`, `roundTeeRectBranch`, `rectTee`, `rectTeeRoundBranch` and the four `*Cross*` kinds) go through one `branchLayout` helper: run length `E + 2 x allowance`, collar and cut-out per branch.
- `calc/waste-factor.ts` - `wasteFactor` (elbows only, other kinds use `table.default`, the user's seam allowance, 1.0 = off), `metalArea = sheetArea * wasteFactor`.
- `calc/sheet-count.ts` - `orderArea` (area x (1 + margin / 100)), `sheetCount` (`ceil(area / sheet area)`), `orderList(groups, config.order)` -> per thickness area, order area, sheets.
- `calc/thickness.ts` - `thickness(size, config)` lookup (`bandStart` decides inclusive or exclusive band edges) (tees and crosses: keyed by the main duct, never the branch); `thicknessSize(fitting)` picks the size that keys it (reducers: larger end, rect-to-round: the rect end, as in the Excel).
- `calc/sheet-list.ts` - `sheetList([{ fitting, quantity }], config)` -> `[{ thicknessMm, area }]` ascending thickness, area in m2 with waste factor times quantity. Sheet count is in `sheet-count.ts`.
- Standalone branch-in collars `roundTap` / `rectTap` (Excel Квр, Пвр) have no module of their own: they are straight-like cases in `sheet-area.ts` (perimeter x stub length), `thickness.ts` (by their own size), `section.ts`, `warnings.ts`; the cut-out in the main duct is not subtracted.
- `calc/branch.ts` - `branchLayout` / `isTeeCross`: perimeters, areas, branch count and run length of tees and crosses (used by `sheet-area.ts` and `warnings.ts`).
- `calc/warnings.ts` - `fittingWarnings(fitting, config)` -> non-blocking `FittingWarning[]` (`aspect.high`, `aspect.excessive`, `size.overLimit`, `elbow.radiusLarge`, `branch.larger`); thresholds in `config.warnings`. Advice only, never changes a size.
- `calc/air.ts` - `airAtConditions(tC, pPa, config)` -> density, kinematic viscosity.
- `calc/aero.ts` - `pressureDrop` (straight section), `pressureDropAt`, `roundOpening` / `rectOpening`.
- `calc/section.ts` - `assembleSection({ fitting, flow, localCoefficient }, air, config)` -> `metalArea` (m2), `centerlineLength` (m), `pressureDrop`. Tees and crosses: main duct only, branch flow not modelled (confirmed by the engineer).
- `form/` - the layer between the UI and the core (plain TS, tested): `fields.ts` (`kindFields`: which inputs each kind has, form prefills, `FormRow` of raw text), `settings.ts` (`SettingsText` -> `buildConfig`: thickness table, seam %, order margin %, sheet size; bad values are reported and keep the default), `layout.ts` (`fieldColumns`: input columns from the widest label, balanced rows; `isLongLabel`: a long label takes the full card width on a phone), `defaults.ts` (`defaultValues`, `presetRow`: default sizes per kind for new rows, `FormRow.preset` until edited), `sample-rows.ts` (`sampleRows`: one default row per kind, the beta start state), `auto-defaults.ts` (elbow radius suggested from the size: `setFieldValue`, `resetToAuto`, `withKind`; typed values are never overwritten), `calculate.ts` (`parseNumber`, `calculate(rows, airText, config)`: text -> Zod validation (`sheetListItemSchema` for fitting + quantity) -> metal area, thickness and `sheetList`, with losses from `assembleSection` marked `lossesAvailable: false` instead of failing the row when they overflow, per-row outcome with `warnings`, totals incl. the area to order and `sheetList` as `OrderLine[]`; a row with a non-positive metal area, e.g. a tee cut-out larger than the wall, is rejected as `input.invalid`), `messages.ts` (`issueMessage`: error code -> text; `warningMessage`: warning -> text with numbers).
- `i18n/uk.ts` - the dictionary: every user-visible string, kind designations (КВ, ПВ, КО, ПО, КП, ПП, ППК, Заглушка, Квр, Пвр) and one message per error code. A new language is one more file with the `Dictionary` shape.
- `src/components/Calculator.tsx` - the page (client component): lays out the blocks, no logic. `src/app/page.tsx` only renders it.
- `form/kind-groups.ts` - `kindGroups` (7 groups of kinds for the side panel), `quickKinds`, `insertIndex` (where a new row of a kind goes), `searchKinds`.
- `src/components/calculator/` - the blocks (new: `KindPalette` = `KindRail` + `Sheet`, `PhoneActions` = the phone's round buttons at the right edge (add menu, view toggles, to top), `KindGlyph`, `KindMenu` change-kind menu, `useDismiss`, `useCardView` = sketch/fold view state shared by the list and the rail buttons): `useCalculator.ts` (hook: rows and settings state, `calculate` fed with fixed hidden flow and air since losses are not shown, row actions), `SettingsPanel`, `FittingList` (view state only; rows of one kind are grouped into a titled section when a kind repeats; per-card sketch open / folded, the global «show/hide all schemes» and «fold/expand all» buttons; folded cards are tiles in a 1-3 column grid, open cards span the full width) > `FittingCard` (one row, or a tile when folded; the button opens `FittingSketch` twice, `view` side / profile; `sketch-spec.ts` maps kind -> shape, round/rect ends and the legends), `ResultsTable`, `Totals`, `SheetList`, shared `TextField`, `ErrorList` (also `WarningList`), `format.ts` (`fmt`, `rowTitle`), `styles.ts` (Tailwind class strings). Components take props only; calculation stays in `src/lib`.
- `validation/` - `createSchemas(config)`, `fittingSchema`, `ductSectionSchema`, `airInputSchema`, `sheetListItemSchema` (`{ fitting, quantity }`), `sheetListSchema` (array of those), `validate`. Errors are stable codes (`codes.ts`), never human text.

## Commands
- `npm ci` - install. Never `npm install` (see Guardrails).
- `npm test` - vitest run (`vitest.config.mts` only adds the `@/` alias for component tests). Must be green before any commit.
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
- Sheet thickness is a versioned lookup table (rect: by larger side, round: by diameter), not a formula. Default: ДБН В.2.5-67:2013 додаток Ц (engineer: "do it by ДБН", 2026-10-19), a size between listed ones takes the next larger listed one (`TODO(confirm)`). The engineer's 0.55 / 0.7 at 400 mm is the selectable option `engineerThickness`.
- Reducer length: default 300 mm, validation floor 150 mm. Never silently clamp what the user typed.
- Pressure drop: Altshul `lambda = 0.11 * (k/d + 68/Re)^0.25`, equivalent diameter `2ab/(a+b)` for rectangles, `dp_friction = lambda * L/d * Pd`, `dp_local = zeta * Pd`. Default roughness 0.1 mm (steel).
- Waste factor applies to elbows only (round: by diameter, rect: by equivalent diameter); every other kind uses the config default 1.0, which the user may raise as a seam allowance (default 0 %). Decided 2026-10-16 (Ш4): no normative source for a general coefficient, and it would double-count `allowance`.
- Order margin (default 20 %) and sheet size (default 1250 x 2500) only feed the "to order" figures and the sheet count = `ceil(order area / sheet area)` per thickness; the computed area never includes them.
- Input problems that are unusual but not wrong (aspect ratio >= 3 / > 6.3, a size over 2000 mm, a large elbow radius) are warnings, never validation errors, and never change what the user typed.
- Pressure drop is hidden in the UI for now (owner, 2026-10-19; area only). It stays out of the main output in the long run: the engineer's order is metal, insulation, price, then aerodynamics as a separate mode.
- `rectReducer` is exact per-face geometry (`developedLength` is the area-equivalent length). `rectToRoundReducer` is a project approximation (slant from width only). The Excel is a reference, not the truth.
- Reducer sections in `assembleSection`: friction by the mean of the end hydraulic diameters (engineer, 2026-10-19), velocity is the mean of both ends, `dp_local = zeta * Pd` at that mean velocity (engineer, 2026-10-16).

## Guardrails in `.claude/settings.json`
- `Edit`/`Write` are denied for `**/*.fixtures.ts`, `**/__fixtures__/pending/**`, `__tests__/sheet-area.test.ts` and `__tests__/aero.test.ts`. The other tests are not blocked by the harness but the "one rule" still applies to them.
- `npm install` / `npm i` were taken off the deny list by the owner on 2026-10-11 so a Linux thread can add an approved dependency; never run them on Windows. Still denied for the agent: `add`, `update`, `uninstall`, `audit fix`, `dedupe`, `prune`, `link` (and `pnpm`/`yarn` equivalents). On Windows they prune Linux-only `@emnapi/*` entries from `package-lock.json` and break CI `npm ci`. Use `npm ci`. Dependencies are added by Linux threads (and only after asking).
- A `Stop` hook (`.claude/hooks/stop-check.mjs`, plain node, cross-platform) runs typecheck, lint and tests when the agent finishes and blocks the stop with the output if any fail. It is skipped when `git status` shows no changes under `src/` or in package/tsconfig/eslint config. Work already committed in the same session is not re-checked. After one blocked retry it only reports, to avoid loops.

## Naming and style
- camelCase for values, PascalCase for types, discriminated unions on `kind`. Short but meaningful names.
- Vocabulary: `width`, `height`, `diameter`, `smallWidth`, `smallHeight`, `smallDiameter`, `centerRadius` (round elbow), `innerRadius` (rect elbow), `angle`, `allowance`, `length`, `area`, `thickness`.
- One comment per formula: what the geometry is, not what the code does.

## Out of scope for v1 - do not implement
Offsets ("utka"), adapters/boxes, flexible duct area, insulation, any persistence or auth.

## Open questions (waiting for the spreadsheet author - do not guess)
1. Cutting coefficients (1.15 / 1.2 / 1.1): the engineer calls them a flange allowance for all fittings but is unsure and gave no values. We keep elbows only (no source). Revisit with values and a source.
2. «Специфікація» totals (Ш13): the 20 % is probably the order margin (engineer, unsure); his totals rows 30 and 46 are still unexplained. Sheet size is a parameter now.
3. Elbow inner-radius warning threshold (preliminary 2 x width or diameter) and the aspect-ratio threshold (3).
4. ДБН thickness: the rule for sizes between the listed ones, and whether a custom table is wanted later.

Closed 2026-10-19: thickness table (ДБН default, engineer's option), reducer friction by the mean diameter, tee flow for the main duct only.

Closed 2026-10-16: rect elbow radius is inner; tees and crosses subtract the branch opening everywhere (implemented, `tees-crosses.fixtures.ts`); `zeta` of a reducer is at the mean velocity.

Answers the engineer has already given (allowance x2 for rect elbows, reducer length 150 / 300, thickness and flexible-duct roughness as simplifications, ППКр formula bug, the 2026-10-16 answers on the «Шаблон» sheet and the Excel template bugs) are in `docs/decisions.md`, "Engineer answers".

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
