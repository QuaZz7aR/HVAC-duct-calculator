import type { Fitting } from './types';
import { mmToM } from './units';

const notImplemented = (kind: string): never => {
  throw new Error(`not implemented: ${kind}`);
};

/** Wall length along the surface, computed once per fitting and shared by metal and insulation. */
export function developedLength(f: Fitting): number {
  switch (f.kind) {
    case 'roundStraight':
    case 'rectStraight':
    case 'roundCap':
    case 'rectCap':
      return mmToM(f.length);
    case 'roundElbow':
    case 'rectElbow':
    case 'rectToRoundReducer':
      return notImplemented(f.kind);
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
    case 'rectElbow':
    case 'rectToRoundReducer':
      return notImplemented(f.kind);
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
    case 'rectElbow':
    case 'rectToRoundReducer':
      return notImplemented(f.kind);
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
