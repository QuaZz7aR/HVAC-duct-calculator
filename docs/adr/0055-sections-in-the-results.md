# 0055. Sections in the results table

Status: Accepted
Date: 2026-11-19
Source: owner (Nikita), 2026-11-19

## Context
The fitting list groups neighbouring rows of one kind into a titled section (`groupRuns`, ADRs 0049, 0051); the results table listed the rows flat.

## Decision
«Результати по позиціях» uses the same `groupRuns`: a section of two or more rows gets a title row «1–3. КПв — Круглий повітропровід × 3» (positions as in ADR 0051) with the section sums of the actual area, the consumption and the insulation; a single row has no title. A click on the title scrolls to the section in the list. Failed rows count as zero in the sums.

## Consequences
No new strings; the order and the grouping stay one rule for the list and the results.
