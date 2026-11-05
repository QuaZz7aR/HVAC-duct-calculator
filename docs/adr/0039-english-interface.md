# 0039. English interface with a УКР / EN switch

- Status: Accepted
- Date: 2026-11-05
- Source: owner, 2026-11-05 ("давай английский интерфейс с переключателем")

## Context
The UI was Ukrainian only (ADR 0012), with every string in `src/lib/i18n/uk.ts` and a `Dictionary` type ready for a second language. The README is a portfolio page in English, so visitors who don't read Ukrainian could not use the live tool. Ukrainian stays the main language: the target market is Ukraine.

## Decision
- A second dictionary `src/lib/i18n/en.ts` typed as `Dictionary`, so a missing key fails typecheck; a test also compares the key shapes of both.
- The language lives in a small React context (`src/components/i18n.tsx`, `I18nProvider` + `useI18n()` -> `{ lang, dict, fmt, setLang }`), no i18n library. Components read `dict` from the hook instead of importing `uk`; plain helpers (`kindTitle`, `rowTitle`, `isoLegend`, `searchKinds`, `warningMessage`) take the dictionary as a parameter (default `uk` where tests call them without one).
- Ukrainian is the default and is what the server renders. The choice is kept in `localStorage` (`lang`) and read with `useSyncExternalStore`, so a returning English user sees one Ukrainian frame before the switch. No URL per language (`/en`) and no browser-language detection: one static page, the switch is explicit.
- Numbers follow the language: `fmt` uses `dict.locale` (`uk-UA` decimal comma, `en-GB` decimal point), warning texts use `dict.decimal`. Input still accepts both comma and point.
- The switch is two buttons «УКР | EN» at the top right of the header. `<html lang>` and the tab title follow the language (the layout's metadata stays Ukrainian for search engines).
- Size letters (d₁, a₁ × b₁, L, R, α, p, n, ADR 0034) are shared. Fitting codes get short English codes: C = circular, R = rectangular, then D duct, E elbow, R reducer, T tee, X cross, RC = rectangular to circular, CTap / RTap, Cap (CD, RD, CE, RE, CR, RR, RC, CT, CRT, RT, RCT, CX, CRX, RX, RCX). These are the project's own; there is no standard set. The Ukrainian codes (ADR 0036) are unchanged.
- Norm names are transliterated: ДБН В.2.5-67:2013, додаток Ц -> DBN V.2.5-67:2013, annex Ts. Insulation materials are translated descriptively (Izolon (PE foam), foil-faced rubber, foil-faced mineral wool).
- The unused side and cross-section sketches (ADR 0033) keep their Cyrillic letters; they are not shown.

## Consequences
Every new user-visible string goes into both `uk.ts` and `en.ts` (typecheck enforces it). Another language is one more dictionary plus its entry in `src/lib/i18n/index.ts`. The English texts were written by the agent and are not reviewed by a native speaker or the engineer.
