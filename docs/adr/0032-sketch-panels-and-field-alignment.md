# 0032. Two sketch panels and inputs aligned under wrapped labels

- Status: Accepted; the two sketch panels are superseded by [0033](0033-isometric-sketch.md)
- Date: 2026-10-26
- Source: owner remarks with screenshots (2026-10-26)

## Context
The two sketches of a card shared one block with one background, so the side view and the cross-section read as one picture. On desktop a long label, "Довжина, мм (необов'язково: 300)", wrapped to two lines and pushed its input below the inputs of the same row. The reducer legend said "д — малий діаметр або діаметр врізки", branch wording that does not apply to a reducer, which made the reducer sketches look like a tee's.

## Decision
- The side view and the cross-section are two separate panels (own border, background, title on top, legend at the bottom), side by side from `sm` up and stacked on a phone. The note "Схеми умовні, без масштабу." stays once, under both. Amends the layout part of [0029](0029-fitting-sketches.md); the drawings themselves are unchanged.
- A field is a column with its input pushed to the bottom, so the inputs of one row stay on one line even when a label wraps. The label wording is unchanged.
- Reducers (КП, ПП, ППК) name their small end without the branch wording: "д — малий діаметр", "ш × в — мала ширина × висота". Tees, crosses and taps keep the shared wording.

## Consequences
Two more strings in the dictionary (`sketch.legend.smallEndDiameter`, `smallEndRect`). No calculation change.
