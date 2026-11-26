# 0116. Open face of an adapter / box (beta)

- Status: Accepted (beta)
- Date: 2026-11-26
- Source: owner (2026-11-26, «да» to adding an open-face option); the engineer's Kyiv spec, slot-diffuser adapters pos. 32-36, 78; check in `reports/full-recheck-2026-11-26.md` (project files)

## Context
The slot-diffuser adapters of the engineer's Kyiv spec came out 20-45 % above his figures as closed boxes (ADR 0113). A box under a slot diffuser has one long face open for the diffuser; with that face left out his figures are met within about ±11 % (the rest is the partitions, which he may not count).

## Decision
`rectBox` takes `openFaces` 0 / 1 (absent = 0): one a₁ × L wall (a₁ = the first size, the slot width) is left out of the area. The card has the field «Відкрита грань під дифузор (0, 1)», prefill 0. The import sets it to 1 when the name says «щелевой / щілинний диффузор». Partitions are still counted. `TODO(confirm)`: the rule (which face, whether partitions count) is asked in the letter to the engineer of 2026-11-26.

## Consequences
Kyiv slot adapters: pos. 32 1.78 vs 1.60 (+11 %), 33-34 1.49 vs 1.40 (+6 %), 35 0.91 vs 0.90 (+1 %), 36 1.04 vs 1.10 (−5 %); pos. 78 (same size as 33, 1.10 in his file) stays +35 %, probably a slip in the file. Existing boxes and the fixtures are unchanged (absent = closed).
