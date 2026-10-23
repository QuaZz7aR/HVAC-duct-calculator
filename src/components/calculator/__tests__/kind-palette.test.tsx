import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { kindOrder } from "@/lib/form/fields";
import { uk as dict } from "@/lib/i18n/uk";
import { KindGlyph } from "../KindGlyph";
import { KindMenu } from "../KindMenu";
import { PhoneActions } from "../PhoneActions";
import { KindQuickBar, KindRail } from "../KindPalette";
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
    const rail = renderToStaticMarkup(<KindRail count={() => 0} onAdd={() => {}} view={view} hasRows />);
    for (const name of Object.values(dict.kindGroups)) expect(rail).toContain(name);
    expect(rail).toContain(dict.hideAllSketches);
    expect(rail).toContain(dict.palette.collapseCards);
    expect(rail).toContain(dict.palette.toTop);
    expect(renderToStaticMarkup(<KindRail count={() => 0} onAdd={() => {}} view={view} hasRows={false} />)).not.toContain(dict.hideAllSketches);
    const bar = renderToStaticMarkup(<KindQuickBar count={() => 0} onAdd={() => {}} />);
    expect(bar).toContain(dict.palette.allKinds);
    expect(bar).toContain(dict.kinds.roundStraight.designation);
    expect(bar).not.toContain(dict.hideAllSketches);
    const phone = renderToStaticMarkup(<PhoneActions view={view} hasRows />);
    expect(phone).toContain(dict.hideAllSketches);
    expect(phone).toContain(dict.palette.collapseCards);
    expect(phone).not.toContain(dict.palette.toTop);
    expect(renderToStaticMarkup(<PhoneActions view={view} hasRows={false} />)).toBe("");
  });

  it("keeps the kind menu closed until opened", () => {
    const html = renderToStaticMarkup(<KindMenu kind="roundStraight" onChange={() => {}} />);
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain(dict.palette.changeKindTo);
  });
});
