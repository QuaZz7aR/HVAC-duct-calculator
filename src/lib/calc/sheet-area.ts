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
      return mmToM(f.length);
    case 'roundCap':
    case 'rectCap':
    case 'roundElbow':
    case 'rectElbow':
    case 'roundReducer':
    case 'rectReducer':
    case 'rectToRoundReducer':
      return notImplemented(f.kind);
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
    case 'rectCap':
    case 'roundElbow':
    case 'rectElbow':
    case 'roundReducer':
    case 'rectReducer':
    case 'rectToRoundReducer':
      return notImplemented(f.kind);
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
    case 'roundElbow':
    case 'rectElbow':
    case 'roundReducer':
    case 'rectReducer':
    case 'rectToRoundReducer':
      return notImplemented(f.kind);
    default:
      return assertNever(f);
  }
}

function assertNever(x: never): never {
  throw new Error(`unknown fitting: ${JSON.stringify(x)}`);
}
