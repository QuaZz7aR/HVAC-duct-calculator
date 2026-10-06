@AGENTS.md

# HVAC duct calculator

Web tool: list of duct fittings -> sheet-metal area, insulation area, pressure drop per section.
Reference implementation is a practising engineer's Excel; verified numbers live in the fixtures.
Stack: Next.js (App Router), TypeScript strict, Vitest, Zod. Core logic is plain TS in `src/lib/calc/`, no framework imports.

## Commands
- `npm test` - vitest run (must be green before any commit)
- `npm run typecheck` - `tsc --noEmit`
- `npm run lint`

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

## Naming and style
- camelCase for values, PascalCase for types, discriminated unions on `kind`. Short but meaningful names.
- Vocabulary: `width`, `height`, `diameter`, `smallWidth`, `smallHeight`, `smallDiameter`, `centerRadius` (round elbow), `innerRadius` (rect elbow), `angle`, `allowance`, `length`, `area`, `thickness`.
- One comment per formula: what the geometry is, not what the code does.

## Out of scope for v1 - do not implement
Tees and crosses (see `__fixtures__/pending/`), branch-in fittings (round and rect: the "ring" in the Excel formula contradicts the author's definition of allowance), offsets ("utka"), adapters/boxes, flexible duct area, insulation, any persistence or auth.

## Open questions (waiting for the spreadsheet author - do not guess)
1. Rect elbow: is the radius inner or center? The Excel formula treats it as inner; round elbow treats it as center.
2. Tees/crosses: subtract the branch opening from the main duct? Excel does it for one fitting only.
3. What exactly do the cutting coefficients (1.15 / 1.2 / 1.1) cover - waste, seams, both?

## How to work with me
- One fitting kind per session. Exception: stage 0 scaffolding (`units.ts`, `defaultConfig`, stubs) goes together with straight ducts. Plan first (plan mode), wait for approval, then implement.
- Add a fitting: type in `types.ts` -> fixture exists -> test red -> implement -> green -> typecheck.
- Never invent a coefficient, a standard or a table. If a source is missing, add a config entry with `TODO(confirm)` and ask.
- No new dependencies without asking.
