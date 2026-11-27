# HVAC duct calculator

**English** · [Українська](README.uk.md)

A web calculator for sheet-metal ductwork. You list the duct fittings of a ventilation system (straight ducts, elbows, reducers, tees, crosses, caps, branch-in collars) with their sizes, and it returns the sheet-metal area of every item, the metal thickness by the Ukrainian norm, a metal list grouped by thickness with the number of sheets to order, the insulation area and a cost estimate from your own prices.

**Live:** https://hvac-duct-calculator-rho.vercel.app

The interface is in Ukrainian by default, with an English version: the УКР / EN switch (bottom of the side panel on desktop, the «☰» menu on a phone) changes the language, and the browser remembers the choice. The tool is built for duct designers and sheet-metal shops in Ukraine. Everything is calculated in the browser; there is no backend, and the project is kept only in your browser.

![Calculator on desktop: side panel for adding fittings, calculation settings and a fitting card with its isometric sketch](docs/images/desktop.png)

## What it does

- **Metal area per item.** Developed surface of each fitting from its geometry, with the connection allowance for flanges and the cutting coefficient for elbows; taps include the flat ring around the stub. Long straights are split into shop pieces (3 m round, 1.25 m rect by default, editable), e.g. 22.5 m = 7 × 3 m + 1 × 1.5 m. Reducers, tees and crosses show two numbers: the actual area and the metal consumption (reducers at least 300 mm long, tees without the branch cut-out), which the order, the sheets and the price use.
- **Metal thickness.** Looked up from the table of ДБН В.2.5-67:2013, annex Ц (round: by diameter, rectangular: by the larger side). The engineer's own table is available as an option (rectangular parts by the equivalent diameter, as in his orders). Each elbow, reducer, tee and cross can count the flange allowance at 2, 1 or 0 ends.
- **Metal list by thickness.** Area per thickness, area to order with a margin (20 % by default) and the number of sheets for the chosen sheet size (1000 × 2000, 1250 × 2500 or 1500 × 3000).
- **Insulation area (beta).** Pick an insulation material per item (six from the engineer's spreadsheet); the outer surface of the layer is the metal geometry with each size increased by twice the layer thickness. Area per item, a list per material and a total. The model will be refined with the engineer.
- **Equipment (beta).** Air handling units, duct heaters, fans and coolers go into their own block: outer sizes and the duct openings (round or rectangular). No metal is counted, only the casing insulation (outer surface of the layer less the openings), added to the insulation list and its cost.
- **Cost estimate.** Enter your own price per m² (UAH) for each sheet thickness and insulation material: cost per line and in total. Metal is priced on the area to order (the consumption with the margin). No prices are preset.
- **Input warnings.** Unusual but valid input (aspect ratio of 3 and above, over 6.3, a side over 2000 mm, a large elbow radius) is flagged and never changed.
- **Import from Excel or PDF.** Load a ready-made spec (.xlsx, .csv or a PDF with text, not a scan): the site finds the columns (type code or name, sizes, length, quantity, system and number), recognises the fitting kinds from the engineer's codes and from names such as «КО 90 Д150», shows every row and lets you pick a kind for the ones it does not know. The file is read in the browser and never uploaded.
- **Numbering by systems.** One button gives the positions «system-number» (ПВ1-1, ПВ1-2): to the empty ones only or to all again, with a preview first.
- **Light or dark theme, blue or brick-red accent.** Remembered in the browser.
- **Help with video.** «Як користуватися» beside the title (a round «?» on a phone) walks through six steps, seven on a phone, each with a short clip of the real interface.
- **Export.** Download the results as an Excel file (specification with totals, metal list by thickness, insulation list) or print them / save as PDF.
- **Saved in your browser.** The list, its order and positions, the settings and the prices are kept in this browser between visits (nothing is sent anywhere); «Delete all» starts over.
- **Simple and advanced mode.** The simple mode (default) shows only sizes, quantity and the metal figures; the advanced mode adds the calculation settings, allowances, insulation and prices. The choice is remembered in the browser; hidden values still count.
- **Start.** A new project opens empty: add fittings from the side panel or import a specification; the project is kept in your browser.
- **Sketches.** Each fitting card shows a thumbnail of its isometric sketch; a click opens the full sketch with the dimension letters used in the form.

| Fittings folded into tiles, with the results table | Totals, metal and insulation lists with prices |
|---|---|
| ![All 19 fitting kinds folded into compact tiles](docs/images/desktop-folded.png) | ![Results per item, totals, the metal list with sheet counts and the insulation list with costs](docs/images/totals.png) |

On a phone the side panel becomes a column of round buttons at the screen edge, with a quick menu of common kinds and a searchable list of all of them.

<img src="docs/images/phone.png" alt="Calculator on a phone: fitting card with its sketch and the round action buttons" width="320">

## Supported fittings

22 kinds (3 of them beta), named by the designations a Ukrainian spec uses.

In the English interface the same kinds have short English codes (C = circular, R = rectangular): CD, RD ducts; CE, RE elbows; CR, RR, RC reducers; CTap, RTap collars; CT, CRT, RT, RCT tees; CX, CRX, RX, RCX crosses; RA adapter / box, CO, RO offsets.

| Group | Kinds |
|---|---|
| Straight ducts | round (КПв), rectangular (ППв) |
| Elbows | round (КВд), rectangular (ПВд), any angle |
| Reducers | round (КП), rectangular (ПП), rectangular to round (ППК) |
| Caps | round, rectangular |
| Branch-in collars | round (Квр), rectangular (Пвр) |
| Tees | round (КТ), round with a rectangular branch (КПТ), rectangular (ПТ), rectangular with a round branch (ПКТ) |
| Beta | adapter / box (ПА), round offset (КУ), rectangular offset (ПУ): formulas from open sources, not yet confirmed by the engineer |
| Crosses | round with round branches (ККХ), round with rectangular branches (КПХ), rectangular with rectangular branches (ППХ), rectangular with round branches (ПКХ) |

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
src/lib/i18n/        every user-visible string (Ukrainian and English dictionaries)
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

- Adapters with an open side, filter adapters (the beta covers closed boxes and offsets)
- Aerodynamics as a separate mode
- XLSX export of the specification
