import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { kindOrder } from "@/lib/form/fields";
import { uk as dict } from "@/lib/i18n/uk";
import { KindGlyph } from "../KindGlyph";
import { KindMenu } from "../KindMenu";
import { KindQuickBar, KindRail } from "../KindPalette";

describe("kind palette", () => {
  it("draws a glyph for every kind", () => {
    for (const kind of kindOrder) expect(renderToStaticMarkup(<KindGlyph kind={kind} />)).toContain("<svg");
  });

  it("shows a rail button per group and quick buttons with the all-kinds entry", () => {
    const rail = renderToStaticMarkup(<KindRail count={() => 0} onAdd={() => {}} />);
    for (const name of Object.values(dict.kindGroups)) expect(rail).toContain(name);
    const bar = renderToStaticMarkup(<KindQuickBar count={() => 0} onAdd={() => {}} />);
    expect(bar).toContain(dict.palette.allKinds);
    expect(bar).toContain(dict.kinds.roundStraight.designation);
  });

  it("keeps the kind menu closed until opened", () => {
    const html = renderToStaticMarkup(<KindMenu kind="roundStraight" onChange={() => {}} />);
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain(dict.palette.changeKindTo);
  });
});
