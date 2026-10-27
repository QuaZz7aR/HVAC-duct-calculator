import type { Fitting } from './types';
import { branchLayout } from './branch';
import { degToRad, mmToM } from './units';

/** Wall length along the surface, computed once per fitting and shared by metal and insulation. */
export function developedLength(f: Fitting): number {
  switch (f.kind) {
    case 'roundStraight':
    case 'rectStraight':
    case 'roundCap':
    case 'rectCap':
    case 'roundTap':
    case 'rectTap':
      return mmToM(f.length);
    case 'roundElbow':
      // bend arc along the center radius plus the connection allowance at both ends
      return centerlineLength(f) + 2 * mmToM(f.allowance);
    case 'rectElbow':
      // bend arc along the center radius plus the connection allowance at both ends
      return centerlineLength(f) + 2 * mmToM(f.allowance);
    case 'rectToRoundReducer':
      // Area-equivalent length (transition area / mean perimeter), like rectReducer; allowance strips at both ends.
      return rectToRoundArea(f) / rectToRoundMeanPerimeter(f) + 2 * mmToM(f.allowance);
    case 'rectReducer': {
      // Area-equivalent length (total face area / mean perimeter), NOT a physical edge length: there is no single slant.
      // Top/bottom trapezoids slope by (H - h) / 2, side trapezoids by (W - w) / 2; allowance strips at both ends.
      const W = mmToM(f.width);
      const H = mmToM(f.height);
      const w = mmToM(f.smallWidth);
      const h = mmToM(f.smallHeight);
      const L = mmToM(f.length);
      const topBottom = (W + w) * Math.sqrt(L ** 2 + ((H - h) / 2) ** 2);
      const sides = (H + h) * Math.sqrt(L ** 2 + ((W - w) / 2) ** 2);
      return (topBottom + sides) / (W + H + w + h) + 2 * mmToM(f.allowance);
    }
    case 'roundReducer': {
      // cone generatrix (slant height) plus the connection allowance at both ends
      const slant = Math.sqrt(mmToM(f.length) ** 2 + ((mmToM(f.diameter) - mmToM(f.smallDiameter)) / 2) ** 2);
      return slant + 2 * mmToM(f.allowance);
    }
    case 'roundTee':
    case 'roundTeeRectBranch':
    case 'rectTee':
    case 'rectTeeRoundBranch':
    case 'roundCross':
    case 'roundCrossRectBranches':
    case 'rectCross':
    case 'rectCrossRoundBranches':
      // main run along the axis: branch size plus the connection allowance at both ends
      return branchLayout(f).runLength;
    default:
      return assertNever(f);
  }
}

/** Sheet-metal area in m2: pure geometry, no cutting waste. */
export function sheetArea(f: Fitting): number {
  switch (f.kind) {
    case 'roundStraight':
    case 'roundTap':
      // cylinder wall (a tap is the same stub, its cut-out in the main duct is not subtracted): circumference x developed length
      return Math.PI * mmToM(f.diameter) * developedLength(f);
    case 'rectStraight':
    case 'rectTap':
      // four walls: perimeter x developed length
      return 2 * (mmToM(f.width) + mmToM(f.height)) * developedLength(f);
    case 'roundCap':
      // end disc + cylindrical skirt
      return (Math.PI * mmToM(f.diameter) ** 2) / 4 + Math.PI * mmToM(f.diameter) * developedLength(f);
    case 'rectCap':
      // end plate + four skirt walls
      return mmToM(f.width) * mmToM(f.height) + 2 * (mmToM(f.width) + mmToM(f.height)) * developedLength(f);
    case 'roundElbow':
      // torus segment unrolled: circumference x developed length
      return Math.PI * mmToM(f.diameter) * developedLength(f);
    case 'rectElbow':
      // four walls (two cheeks + inner and outer curved walls) unrolled: perimeter x developed length
      return 2 * (mmToM(f.width) + mmToM(f.height)) * developedLength(f);
    case 'rectToRoundReducer':
      // transition surface + allowance strips: mean of rect and round perimeters x area-equivalent developed length
      return rectToRoundMeanPerimeter(f) * developedLength(f);
    case 'rectReducer':
      // four trapezoid faces + allowance strips: mean perimeter x area-equivalent developed length
      return (mmToM(f.width) + mmToM(f.height) + mmToM(f.smallWidth) + mmToM(f.smallHeight)) * developedLength(f);
    case 'roundReducer':
      // frustum surface: mean circumference x developed length (cone wall + allowance strips at both ends)
      return (Math.PI * (mmToM(f.diameter) + mmToM(f.smallDiameter)) / 2) * developedLength(f);
    case 'roundTee':
    case 'roundTeeRectBranch':
    case 'rectTee':
    case 'rectTeeRoundBranch':
    case 'roundCross':
    case 'roundCrossRectBranches':
    case 'rectCross':
    case 'rectCrossRoundBranches':
      {
        // main run wall + collar of each branch - cut-out of each branch (flat cross-section, the saddle effect is ignored)
        const b = branchLayout(f);
        return b.mainPerimeter * b.runLength + b.count * (b.branchPerimeter * b.collar - b.branchArea);
      }
    default:
      return assertNever(f);
  }
}

/** Flow path length in m: pure geometry, independent of allowance, waste and area. */
export function centerlineLength(f: Fitting): number {
  switch (f.kind) {
    case 'roundStraight':
    case 'rectStraight':
      return mmToM(f.length);
    case 'roundCap':
    case 'rectCap':
      // TODO(confirm): cap centerline = 0 (not in CLAUDE.md)
      return 0;
    case 'roundTap':
    case 'rectTap':
      // TODO(confirm): a tap is a stub off the main flow, so no flow path of its own
      return 0;
    case 'roundElbow':
      // arc of the bend along the center radius
      return mmToM(f.centerRadius) * degToRad(f.angle);
    case 'rectElbow':
      // innerRadius is the INNER radius (confirmed) and width is the bend-plane side (confirmed by the engineer 2026-10-16); center radius = innerRadius + width / 2
      return (mmToM(f.innerRadius) + mmToM(f.width) / 2) * degToRad(f.angle);
    case 'rectToRoundReducer':
    case 'rectReducer':
      // TODO(confirm): reducer centerline = axial length (not in CLAUDE.md, no fixture covers it)
      return mmToM(f.length);
    case 'roundReducer':
      // TODO(confirm): reducer centerline = axial length (not in CLAUDE.md, no fixture covers it)
      return mmToM(f.length);
    case 'roundTee':
    case 'roundTeeRectBranch':
    case 'rectTee':
    case 'rectTeeRoundBranch':
    case 'roundCross':
    case 'roundCrossRectBranches':
    case 'rectCross':
    case 'rectCrossRoundBranches':
      // TODO(confirm): flow path through the main run = the branch size along the axis, no allowance (the Excel has only the run length with allowance)
      return branchLayout(f).along;
    default:
      return assertNever(f);
  }
}

type RectToRound = Extract<Fitting, { kind: 'rectToRoundReducer' }>;

/** Mean of the rect and round end perimeters, m. */
function rectToRoundMeanPerimeter(f: RectToRound): number {
  return (2 * (mmToM(f.width) + mmToM(f.height)) + Math.PI * mmToM(f.smallDiameter)) / 2;
}

/** Simpson intervals for the corner cone; the integrand is smooth, 64 keeps the error far below 1e-9 m2. */
const coneSteps = 64;

/**
 * Concentric rect-to-round transition as a sheet-metal layout (ADR 0035), without allowance, m2:
 * four flat triangles from each rect side to the circle point facing it, four cones from each rect corner to a quarter of the circle.
 */
function rectToRoundArea(f: RectToRound): number {
  const a = mmToM(f.width) / 2;
  const b = mmToM(f.height) / 2;
  const r = mmToM(f.smallDiameter) / 2;
  const L = mmToM(f.length);
  // triangle on a side of length 2a: base x height / 2, height = distance from the facing circle point to that side
  const triangles = 2 * a * Math.sqrt(L ** 2 + (b - r) ** 2) + 2 * b * Math.sqrt(L ** 2 + (a - r) ** 2);
  // cone from the corner (a, b, 0) to the arc (r cos t, r sin t, L): dA = r / 2 * sqrt(L^2 + (r - a cos t - b sin t)^2) dt, t in [0, pi/2]
  const slant = (t: number) => Math.sqrt(L ** 2 + (r - a * Math.cos(t) - b * Math.sin(t)) ** 2);
  const h = Math.PI / 2 / coneSteps;
  let sum = slant(0) + slant(Math.PI / 2);
  for (let i = 1; i < coneSteps; i++) sum += (i % 2 ? 4 : 2) * slant(i * h);
  const cone = (r / 2) * (h / 3) * sum;
  return triangles + 4 * cone;
}

function assertNever(x: never): never {
  throw new Error(`unknown fitting: ${JSON.stringify(x)}`);
}
