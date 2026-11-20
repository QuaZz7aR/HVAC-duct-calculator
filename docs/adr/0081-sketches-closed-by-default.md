# 0081. Full sketches closed by default

Status: Accepted
Date: 2026-11-20
Source: owner, 2026-11-20 ("сделай чтобы по-дефолту изометрия не показывалась")

## Context
During the beta every card opened with its full isometric sketch (ADR 0030, `sketchesOpenByDefault = true`). With imported lists of 40-70 rows the open sketches take most of the page.

## Decision
`sketchesOpenByDefault` is false: cards, sample rows and added rows show only the thumbnail; a click on it opens the sketch (ADR 0040), and «show all schemes» still opens them all. The beta sample rows stay.

## Consequences
The list is much shorter on load. This changes the part of ADR 0030 about open sketches; the rest of it stands.
