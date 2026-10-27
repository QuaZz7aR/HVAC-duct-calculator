# HVAC duct calculator

A web calculator for sheet-metal ductwork. You list the duct fittings of a ventilation system (straight ducts, elbows, reducers, tees, crosses, caps, branch-in collars) with their sizes, and it returns the sheet-metal area of every item, the metal thickness by the Ukrainian norm, and a metal list grouped by thickness with the number of sheets to order.

**Live:** https://hvac-duct-calculator-rho.vercel.app

The interface is in Ukrainian: the tool is built for duct designers and sheet-metal shops in Ukraine. Everything is calculated in the browser; there is no backend and nothing is stored.

![Calculator on desktop: side panel for adding fittings, calculation settings and a fitting card with its isometric sketch](docs/images/desktop.png)

## What it does

- **Metal area per item.** Developed surface of each fitting from its geometry, with the connection allowance for flanges and the cutting coefficient for elbows.
- **Metal thickness.** Looked up from the table of ДБН В.2.5-67:2013, annex Ц (round: by diameter, rectangular: by the larger side). The engineer's own table is available as an option.
- **Metal list by thickness.** Area per thickness, area to order with a margin (20 % by default) and the number of sheets for the chosen sheet size (1000 × 2000, 1250 × 2500 or 1500 × 3000).
- **Input warnings.** Unusual but valid input (aspect ratio of 3 and above, over 6.3, a side over 2000 mm, a large elbow radius) is flagged and never changed.
- **Sketches.** Each fitting card shows an isometric sketch with the dimension letters used in the form.

| Fittings folded into tiles, with the results table | Totals and metal list by thickness |
|---|---|
| ![All 19 fitting kinds folded into compact tiles](docs/images/desktop-folded.png) | ![Results per item, totals and the metal list with sheet counts](docs/images/totals.png) |

On a phone the side panel becomes a column of round buttons at the screen edge, with a quick menu of common kinds and a searchable list of all of them.

<img src="docs/images/phone.png" alt="Calculator on a phone: fitting card with its sketch and the round action buttons" width="320">

## Supported fittings

19 kinds, named by the designations a Ukrainian spec uses.

| Group | Kinds |
|---|---|
| Straight ducts | round (КВ), rectangular (ПВ) |
| Elbows | round (КО), rectangular (ПО), any angle |
| Reducers | round (КП), rectangular (ПП), rectangular to round (ППК) |
| Caps | round, rectangular |
| Branch-in collars | round (Квр), rectangular (Пвр) |
| Tees | round (КТ), round with a rectangular branch (КПТ), rectangular (ПТ), rectangular with a round branch (ПКТ) |
| Crosses | round with round branches (КККр), round with rectangular branches (КПКр), rectangular with rectangular branches (ППКр), rectangular with round branches (ПККр) |

Tees and crosses subtract the branch openings from the main duct; thickness follows the main duct.

## How the numbers are verified

The reference is a calculation spreadsheet that a practising HVAC engineer has used on real projects for years. The calculator was built against it, not just inspired by it:

- **Fixtures are the source of truth.** Expected values live in [`src/lib/calc/__fixtures__/`](src/lib/calc/__fixtures__/) and are committed by hand, separately from the code. Each case is marked `basis: 'geometry'` (derived independently from first principles) or `basis: 'excel'` (follows the spreadsheet's convention). Tests are never adjusted to make code pass.
- **The Excel is a reference, not the truth.** Checking it line by line turned up formula bugs in the template. Where the spreadsheet is wrong, the calculator computes the correct value and the deviation is documented ([ADR 0001](docs/adr/0001-excel-is-a-reference-not-the-truth.md), and [known deviations](docs/decisions.md)).
- **Open questions go to the engineer.** Coefficients without a confirmed source are kept in config with a `TODO(confirm)` mark and listed in a register instead of being guessed. His answers are logged in [`docs/engineer-answers.md`](docs/engineer-answers.md).
- **Ukrainian norms.** Thickness and the aspect-ratio limits come from ДБН В.2.5-67:2013.

Every engineering decision has its own record in [`docs/adr/`](docs/adr/) (context, decision, consequences, source), indexed in [`docs/decisions.md`](docs/decisions.md).

## Architecture

```
src/lib/calc/        pure TypeScript core: geometry, thickness, waste factor, sheet count,
                     air properties and pressure drop. No framework, no validation library.
src/lib/validation/  Zod schemas around the core; errors are stable codes, not text
src/lib/form/        form layer: raw text -> validated input -> results; defaults and warnings
src/lib/i18n/        every user-visible string (Ukrainian dictionary)
src/components/      React components; props only, no calculation
```

- Units: millimetres, degrees and m³/h at the boundary, SI inside the core, converted in one module.
- One developed length per fitting feeds every area figure, so two copies of the same geometry cannot drift apart.
- The core also computes pressure losses (Altshul friction, local resistances, air properties at given conditions). They are hidden in the UI for now and will come back as a separate aerodynamics mode.

## Stack

Next.js (App Router), React, TypeScript (strict), Tailwind CSS, Zod, Vitest. Deployed on Vercel with Vercel Web Analytics. CI on GitHub Actions runs typecheck, lint and tests on every pull request.

## Run locally

Requires Node 24 (see `.nvmrc`).

```bash
npm ci
npm run dev        # http://localhost:3000
npm test           # unit tests (Vitest)
npm run typecheck
npm run lint
```

## Roadmap

- Insulation area
- Adapters and plenum boxes
- Price estimate
- Aerodynamics as a separate mode
- XLSX export of the specification
