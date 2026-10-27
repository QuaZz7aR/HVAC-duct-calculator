# 0033. One isometric sketch instead of two views

- Status: Accepted
- Date: 2026-10-27
- Source: the engineer, relayed by the owner (2026-10-27): "make the sketches isometric"; the owner picked the line style and isometry instead of the two views from mockups

## Context
Cards showed two flat views per fitting, a side view and a cross-section ([0029](0029-fitting-sketches.md), [0032](0032-sketch-panels-and-field-alignment.md)). The engineer asked for isometric sketches. Mockups offered a line style and a shaded style, and isometry instead of or next to the two views.

## Decision
- Each card shows one panel, «Ізометрія», with one isometric drawing of its kind (`view="iso"` of `FittingSketch`, geometry in `iso-sketch.ts`), a legend (`isoLegend`) and the note "Схема умовна, без масштабу."
- Line style: thin outlines, faces filled with the card colours (dark theme aware), open ends a shade darker, a cap's end plate darker still, hidden edges dashed and drawn over the faces (seen through the wall), the back end of a tube shows only its far half, dimensions drawn as on a hand drawing: thin extension lines from the measured points on the part running a little past the dimension line, arrows at both ends, the letter beside it (Nikita, 2026-10-27); the radius is a dashed leader from the centre dot with an arrow at the arc. Dimension lines and letters never cross a wall or another letter; `__tests__/iso-sketch.test.ts` checks this for every kind (the round elbow's R ends on the dash-dot centre line by definition). The same test checks that no dimension or extension line crosses another dimension's lines and that no extension line runs through a letter.
- Drawn by an isometric projection of simple solids (cylinders and tubes along a path, boxes and frustums), in schematic proportions, never the user's sizes. Elbows are drawn at 90° in the horizontal plane; the legend says the angle comes from the field. Rect sizes are marked on their own edges, so the legend names Ш and В (ш and в) separately. A tap stands on a dashed outline of the duct it is cut into. A cross draws the lower branch first, the main duct covers where it starts.
- The two flat views stay in the code (`view="side"` / `"profile"`, `sketchLegend`, `profileLegend`) with their tests, unused by the card, so they can come back (for example in a print or aerodynamics mode) without redrawing. Supersedes the two-panel layout of [0032](0032-sketch-panels-and-field-alignment.md); its field alignment and reducer wording stay.

## Consequences
The card button reads «Показати схему» / «Сховати схему». The drawing's width follows its own extent at one scale, so letters are the same size for every kind. README screenshots are retaken.
