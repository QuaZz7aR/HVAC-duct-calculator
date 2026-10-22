import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { kindOrder } from "@/lib/form/fields";
import { uk as dict } from "@/lib/i18n/uk";
import { FittingSketch } from "../FittingSketch";
import { profileLegend, sketchLegend, sketchSpecs } from "../sketch-spec";

describe("FittingSketch", () => {
  it("has a drawing for every fitting kind", () => {
    expect(Object.keys(sketchSpecs).sort()).toEqual([...kindOrder].sort());
    for (const kind of kindOrder) {
      for (const view of ["side", "profile"] as const) {
        const html = renderToStaticMarkup(<FittingSketch kind={kind} view={view} />);
        expect(html).toContain("<svg");
        expect(html).toContain(dict.kinds[kind].designation);
      }
    }
  });

  it("labels round ends with Д and rect ends with Ш × В", () => {
    expect(renderToStaticMarkup(<FittingSketch kind="roundStraight" />)).toContain(">Д<");
    expect(renderToStaticMarkup(<FittingSketch kind="rectStraight" />)).toContain(">Ш × В<");
    expect(renderToStaticMarkup(<FittingSketch kind="roundStraight" view="profile" />)).toContain(">Д<");
    const rectProfile = renderToStaticMarkup(<FittingSketch kind="rectStraight" view="profile" />);
    expect(rectProfile).toContain(">Ш<");
    expect(rectProfile).toContain(">В<");
  });

  it("shows the round small end of a rect-to-round reducer and the rect branch of a round tee", () => {
    const reducer = renderToStaticMarkup(<FittingSketch kind="rectToRoundReducer" />);
    expect(reducer).toContain(">Ш × В<");
    expect(reducer).toContain(">д<");
    expect(renderToStaticMarkup(<FittingSketch kind="roundTeeRectBranch" />)).toContain(">ш × в<");
  });

  it("draws each kind with its own shape", () => {
    const shapes = Object.fromEntries(kindOrder.map((k) => [k, sketchSpecs[k].shape]));
    expect(shapes).toMatchObject({
      roundStraight: "straight", rectCap: "cap", roundTap: "tap", rectElbow: "elbow",
      rectToRoundReducer: "reducer", rectTeeRoundBranch: "tee", roundCrossRectBranches: "cross",
    });
  });

  it("explains the radius of each elbow in the wording of its field", () => {
    expect(sketchLegend("roundElbow")).toContain(dict.sketch.legend.centerRadius);
    expect(sketchLegend("rectElbow")).toContain(dict.sketch.legend.innerRadius);
    expect(profileLegend("rectTee")).toContain(dict.sketch.dashedBranch);
    expect(profileLegend("roundStraight")).toEqual([dict.sketch.profileDiameter]);
    expect(sketchLegend("rectTee")).toEqual([dict.sketch.legend.rect, dict.sketch.legend.smallRect]);
  });
});
