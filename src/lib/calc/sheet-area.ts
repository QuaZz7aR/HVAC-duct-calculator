import type { Fitting } from './types';
import { degToRad, mmToM } from './units';

/** Wall length along the surface, computed once per fitting and shared by metal and insulation. */
export function developedLength(f: Fitting): number {
  switch (f.kind) {
    case 'roundStraight':
    case 'rectStraight':
    case 'roundCap':
    case 'rectCap':
      return mmToM(f.length);
    case 'roundElbow':
      // bend arc along the center radius plus the connection allowance at both ends
      return centerlineLength(f) + 2 * mmToM(f.allowance);
    case 'rectElbow':
      // bend arc along the center radius plus the connection allowance at both ends
      return centerlineLength(f) + 2 * mmToM(f.allowance);
    case 'rectToRoundReducer': {
      // TODO(confirm): v1 approximation from engineer's Excel, slant uses (W - d)/2 only; height ignored, same as rectReducer. Cone generatrix plus allowance at both ends.
      const slant = Math.sqrt(mmToM(f.length) ** 2 + ((mmToM(f.width) - mmToM(f.smallDiameter)) / 2) ** 2);
      return slant + 2 * mmToM(f.allowance);
    }
    case 'rectReducer': {
      // TODO(confirm): v1 approximation from engineer's Excel, slant uses width offset only; height taper ignored, area understated when (H-h) >> (W-w). Exact per-face geometry is option B, pending engineer decision.
      const slant = Math.sqrt(mmToM(f.length) ** 2 + ((mmToM(f.width) - mmToM(f.smallWidth)) / 2) ** 2);
      return slant + 2 * mmToM(f.allowance);
    }
    case 'roundReducer': {
      // cone generatrix (slant height) plus the connection allowance at both ends
      const slant = Math.sqrt(mmToM(f.length) ** 2 + ((mmToM(f.diameter) - mmToM(f.smallDiameter)) / 2) ** 2);
      return slant + 2 * mmToM(f.allowance);
    }
    default:
      return assertNever(f);
  }
}

/** Sheet-metal area in m2: pure geometry, no cutting waste. */
export function sheetArea(f: Fitting): number {
  switch (f.kind) {
    case 'roundStraight':
      // cylinder wall: circumference x developed length
      return Math.PI * mmToM(f.diameter) * developedLength(f);
    case 'rectStraight':
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
      // transition surface: mean of rect and round perimeters x developed length
      return ((2 * (mmToM(f.width) + mmToM(f.height)) + Math.PI * mmToM(f.smallDiameter)) / 2) * developedLength(f);
    case 'rectReducer':
      // four trapezoid faces: mean perimeter x developed length
      return (mmToM(f.width) + mmToM(f.height) + mmToM(f.smallWidth) + mmToM(f.smallHeight)) * developedLength(f);
    case 'roundReducer':
      // frustum surface: mean circumference x developed length (cone wall + allowance strips at both ends)
      return (Math.PI * (mmToM(f.diameter) + mmToM(f.smallDiameter)) / 2) * developedLength(f);
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
    case 'roundElbow':
      // arc of the bend along the center radius
      return mmToM(f.centerRadius) * degToRad(f.angle);
    case 'rectElbow':
      // TODO(confirm): innerRadius is the INNER radius and width is the bend-plane side (CLAUDE.md open question 1); center radius = innerRadius + width / 2
      return (mmToM(f.innerRadius) + mmToM(f.width) / 2) * degToRad(f.angle);
    case 'rectToRoundReducer':
    case 'rectReducer':
      // TODO(confirm): reducer centerline = axial length (not in CLAUDE.md, no fixture covers it)
      return mmToM(f.length);
    case 'roundReducer':
      // TODO(confirm): reducer centerline = axial length (not in CLAUDE.md, no fixture covers it)
      return mmToM(f.length);
    default:
      return assertNever(f);
  }
}

function assertNever(x: never): never {
  throw new Error(`unknown fitting: ${JSON.stringify(x)}`);
}
