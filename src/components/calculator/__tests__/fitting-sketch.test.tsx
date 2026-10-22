import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { kindOrder } from "@/lib/form/fields";
import { uk as dict } from "@/lib/i18n/uk";
import { FittingSketch } from "../FittingSketch";
import { sketchSpecs } from "../sketch-spec";

describe("FittingSketch", () => {
  it("has a drawing for every fitting kind", () => {
    expect(Object.keys(sketchSpecs).sort()).toEqual([...kindOrder].sort());
    for (const kind of kindOrder) {
      const html = renderToStaticMarkup(<FittingSketch kind={kind} />);
      expect(html).toContain("<svg");
      expect(html).toContain(dict.kinds[kind].designation);
    }
  });

  it("labels round ends with Д and rect ends with Ш × В", () => {
    expect(renderToStaticMarkup(<FittingSketch kind="roundStraight" />)).toContain(">Д<");
    expect(renderToStaticMarkup(<FittingSketch kind="rectStraight" />)).toContain(">Ш × В<");
  });

  it("shows the round small end of a rect-to-round reducer and the rect branch of a round tee", () => {
    const reducer = renderToStaticMarkup(<FittingSketch kind="rectToRoundReducer" />);
    expect(reducer).toContain(">Ш × В<");
    expect(reducer).toContain(">д<");
    expect(renderToStaticMarkup(<FittingSketch kind="roundTeeRectBranch" />)).toContain(">ш × в<");
  });
});
