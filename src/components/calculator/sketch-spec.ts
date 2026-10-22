import type { FittingKind } from "@/lib/form/fields";
import { uk as dict } from "@/lib/i18n/uk";

export type SketchShape = "straight" | "cap" | "tap" | "elbow" | "reducer" | "tee" | "cross";

export interface SketchSpec {
  shape: SketchShape;
  /** The main duct (or the large end) is round; rect otherwise. */
  roundMain: boolean;
  /** The small end / branch is round; rect otherwise. Only for shapes that have one. */
  roundSmall?: boolean;
}

/** Which drawing each fitting kind uses and whether its ends are round or rectangular. */
export const sketchSpecs: Record<FittingKind, SketchSpec> = {
  roundStraight: { shape: "straight", roundMain: true },
  rectStraight: { shape: "straight", roundMain: false },
  roundCap: { shape: "cap", roundMain: true },
  rectCap: { shape: "cap", roundMain: false },
  roundTap: { shape: "tap", roundMain: true },
  rectTap: { shape: "tap", roundMain: false },
  roundElbow: { shape: "elbow", roundMain: true },
  rectElbow: { shape: "elbow", roundMain: false },
  roundReducer: { shape: "reducer", roundMain: true, roundSmall: true },
  rectReducer: { shape: "reducer", roundMain: false, roundSmall: false },
  rectToRoundReducer: { shape: "reducer", roundMain: false, roundSmall: true },
  roundTee: { shape: "tee", roundMain: true, roundSmall: true },
  roundTeeRectBranch: { shape: "tee", roundMain: true, roundSmall: false },
  rectTee: { shape: "tee", roundMain: false, roundSmall: false },
  rectTeeRoundBranch: { shape: "tee", roundMain: false, roundSmall: true },
  roundCross: { shape: "cross", roundMain: true, roundSmall: true },
  roundCrossRectBranches: { shape: "cross", roundMain: true, roundSmall: false },
  rectCross: { shape: "cross", roundMain: false, roundSmall: false },
  rectCrossRoundBranches: { shape: "cross", roundMain: false, roundSmall: true },
};

/** The letters a sketch uses, each with what it stands for, in the wording of the input fields. */
export function sketchLegend(kind: FittingKind): string[] {
  const { shape, roundMain, roundSmall } = sketchSpecs[kind];
  const l = dict.sketch.legend;
  const main = roundMain ? l.diameter : l.rect;
  const small = roundSmall ? l.smallDiameter : l.smallRect;
  switch (shape) {
    case "straight":
    case "cap":
      return [main, l.length];
    case "tap":
      return [main, l.tapLength];
    case "elbow":
      return [main, roundMain ? l.centerRadius : l.innerRadius, l.angle];
    case "reducer":
      return [main, small, l.length];
    case "tee":
    case "cross":
      return [main, small];
  }
}
