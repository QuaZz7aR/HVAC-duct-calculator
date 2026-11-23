import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { kindOrder } from "@/lib/form/fields";
import { uk as dict } from "@/lib/i18n/uk";
import { KindGlyph } from "../KindGlyph";
import { KindMenu } from "../KindMenu";
import { PhoneActions } from "../PhoneActions";
import { KindRail } from "../KindPalette";
import { ViewBar } from "../ViewBar";
import type { CardView } from "../useCardView";

const view: CardView = {
  sketchOpen: () => true, isFolded: () => false, allSketchesOpen: true, allFolded: false,
  toggleSketch: () => {}, toggleFolded: () => {}, setFoldedMany: () => {}, setAllSketches: () => {}, setAllFolded: () => {},
};

describe("kind palette", () => {
  it("draws a glyph for every kind", () => {
    for (const kind of kindOrder) expect(renderToStaticMarkup(<KindGlyph kind={kind} />)).toContain("<svg");
  });

  it("shows a rail button per group and quick buttons with the all-kinds entry", () => {
    const rail = renderToStaticMarkup(<KindRail count={() => 0} onAdd={() => {}} />);
    for (const name of Object.values(dict.kindGroups)) expect(rail).toContain(name);
    expect(rail).toContain(dict.palette.toTop);
    // the view toggles moved from the rail to the sticky list header (ADR 0088)
    expect(rail).not.toContain(dict.hideAllSketches);
    const bar = renderToStaticMarkup(<ViewBar view={view} onColumns={() => {}} />);
    expect(bar).toContain(dict.hideAllSketches);
    expect(bar).toContain(dict.palette.collapseCards);
    expect(bar).toContain(dict.palette.twoColumns);
    const closed = renderToStaticMarkup(<PhoneActions view={view} hasRows count={() => 0} onAdd={() => {}} />);
    expect(closed).toContain(dict.palette.addButton);
    expect(closed).toContain('aria-expanded="false"');
    expect(closed).not.toContain(dict.palette.allKinds);
    const phone = renderToStaticMarkup(<PhoneActions view={view} hasRows count={() => 0} onAdd={() => {}} />);
    expect(phone).toContain(dict.hideAllSketches);
    expect(phone).toContain(dict.palette.collapseCards);
    expect(phone).not.toContain(dict.palette.toTop);
    expect(renderToStaticMarkup(<PhoneActions view={view} hasRows={false} count={() => 0} onAdd={() => {}} />)).not.toContain(dict.hideAllSketches);
  });

  it("keeps the kind menu closed until opened", () => {
    const html = renderToStaticMarkup(<KindMenu kind="roundStraight" onChange={() => {}} />);
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain(dict.palette.changeKindTo);
  });
});
