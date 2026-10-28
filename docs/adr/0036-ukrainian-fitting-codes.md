# 0036. Ukrainian fitting codes

Status: Accepted
Date: 2026-10-28
Source: the engineer via the owner (2026-10-28), owner's choice on the decision card

## Context
The UI is Ukrainian, but some fitting codes taken from the engineer's Excel come from Russian words: КВ / ПВ (воздуховод, Ukrainian «повітропровід»), КО / ПО (отвод, Ukrainian «відвід») and the crosses КККр, КПКр, ППКр, ПККр (крестовина, Ukrainian «хрестовина»). The engineer asked to remove or rename them. ДБН / ДСТУ define no codes for duct fittings; they are works' and designers' practice.

## Decision
Rename the eight Russian-derived codes, keep the rest (their letters already match Ukrainian words: К круглий, П прямокутний, П перехід, Т трійник, вр врізка):
- КВ -> КПв, ПВ -> ППв (повітропровід, not «воздуховод»; КП / ПП are taken by the reducers). The UI word «повітровод» becomes «повітропровід», as in ДБН.
- КО -> КВд, ПО -> ПВд (відвід).
- КККр -> ККХ, КПКр -> КПХ, ППКр -> ППХ, ПККр -> ПКХ (хрестовина).

Only the user-visible text in `i18n/uk.ts` and the READMEs changes. Code identifiers, comments that cite the Excel cells and the engineer-answer logs keep the Excel codes.

## Consequences
Search in the side panel finds the new codes. Older ADRs and `docs/engineer-answers.md` still use the Excel codes when they speak about the Excel.
