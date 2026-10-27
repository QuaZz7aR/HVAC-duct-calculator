import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { kindOrder } from "@/lib/form/fields";
import { uk as dict } from "@/lib/i18n/uk";
import { FittingSketch } from "../FittingSketch";
import { isoLegend, profileLegend, sketchLegend, sketchSpecs } from "../sketch-spec";
import { isoDrawing } from "../iso-sketch";

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

  it("names the small end of a reducer without the branch wording", () => {
    expect(sketchLegend("rectReducer")).toEqual([dict.sketch.legend.rect, dict.sketch.legend.smallEndRect, dict.sketch.legend.length]);
    expect(profileLegend("roundReducer")).toEqual([dict.sketch.profileDiameter, dict.sketch.dashedSmall, dict.sketch.legend.smallEndDiameter]);
  });
});

describe("isometric sketch", () => {
  it("draws every kind with its letters, rect sizes on separate edges", () => {
    for (const kind of kindOrder) {
      const html = renderToStaticMarkup(<FittingSketch kind={kind} view="iso" />);
      expect(html).toContain(dict.sketch.isoTitle);
      const { roundMain } = sketchSpecs[kind];
      if (roundMain) expect(html).toContain(`>${dict.symbols.diameter}<`);
      else {
        expect(html).toContain(`>${dict.symbols.width}<`);
        expect(html).toContain(`>${dict.symbols.height}<`);
      }
      const { items, box } = isoDrawing(kind);
      expect(items.some((i) => i.type === "face")).toBe(true);
      expect(box.every(Number.isFinite)).toBe(true);
    }
  });

  it("marks the small end, the branch, the radius and the length", () => {
    const labels = (kind: Parameters<typeof isoDrawing>[0]) => isoDrawing(kind).items.flatMap((i) => (i.type === "dim" || i.type === "radius" ? [i.label] : []));
    expect(labels("rectReducer")).toEqual(expect.arrayContaining(["a", "b", "a₁", "b₁", "L"]));
    expect(labels("rectToRoundReducer")).toEqual(expect.arrayContaining(["a", "b", "d₁", "L"]));
    expect(labels("roundTeeRectBranch")).toEqual(expect.arrayContaining(["d", "a₁", "b₁"]));
    expect(labels("roundElbow")).toEqual(expect.arrayContaining(["d", "R"]));
    expect(labels("rectTap")).toEqual(expect.arrayContaining(["a", "b", "L"]));
  });

  it("explains the letters in the wording of the fields", () => {
    expect(isoLegend("rectStraight")).toEqual([dict.sketch.legend.rectSides, dict.sketch.legend.length]);
    expect(isoLegend("rectReducer")).toContain(dict.sketch.legend.smallEndSides);
    expect(isoLegend("roundTee")).toContain(dict.sketch.legend.branchDiameter);
    expect(isoLegend("rectElbow")).toContain(dict.sketch.legend.innerRadius);
    expect(isoLegend("roundTap")).toContain(dict.sketch.legend.tapDuct);
  });
});
