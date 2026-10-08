import { pressureDropAt, rectOpening, roundOpening } from './aero';
import type { Opening } from './aero';
import type { CalcConfig } from './config';
import { metalArea } from './waste-factor';
import { centerlineLength } from './sheet-area';
import type { AirConditions, Fitting, PressureDrop } from './types';
import { m3hToM3s, mmToM } from './units';

export interface SectionInput {
  fitting: Fitting;
  flow: number; // m3/h
  localCoefficient: number; // sum of local resistance coefficients (zeta)
}

/** Boundary in: mm, m3/h. Result in SI: m2, m, Pa. */
export interface SectionResult {
  metalArea: number; // m2, including the cutting-waste factor
  centerlineLength: number; // m
  pressureDrop: PressureDrop;
}

/** One opening for constant-section fittings, both ends for reducers. */
function openings(f: Fitting): Opening[] {
  switch (f.kind) {
    case 'roundStraight':
    case 'roundCap':
    case 'roundElbow':
      return [roundOpening(f.diameter)];
    case 'rectStraight':
    case 'rectCap':
    case 'rectElbow':
      return [rectOpening(f.width, f.height)];
    case 'roundReducer':
      return [roundOpening(f.diameter), roundOpening(f.smallDiameter)];
    case 'rectReducer':
      return [rectOpening(f.width, f.height), rectOpening(f.smallWidth, f.smallHeight)];
    case 'rectToRoundReducer':
      return [rectOpening(f.width, f.height), roundOpening(f.smallDiameter)];
    default:
      return assertNever(f);
  }
}

/** Metal area, centerline length and pressure drop of one fitting carrying `flow`. */
export function assembleSection(input: SectionInput, air: AirConditions, config: CalcConfig): SectionResult {
  const { fitting, flow, localCoefficient } = input;
  if (!Number.isFinite(flow) || flow <= 0) {
    throw new Error(`section flow must be positive: ${flow} m3/h`);
  }
  if (!Number.isFinite(localCoefficient) || localCoefficient < 0) {
    throw new Error(`local coefficient must be non-negative: ${localCoefficient}`);
  }
  const q = m3hToM3s(flow);
  const ends = openings(fitting);
  // friction runs along the centerline; caps have centerline 0 (TODO(confirm) in sheet-area.ts), so no friction
  const length = centerlineLength(fitting);

  // TODO(confirm): reducers follow the engineer's Excel - hydraulic diameter of the larger end and
  // the arithmetic mean of the end velocities, which also sets the dynamic pressure of the local loss.
  const velocity = ends.reduce((sum, o) => sum + q / o.area, 0) / ends.length;
  const dh = Math.max(...ends.map((o) => o.dh));

  return {
    metalArea: metalArea(fitting, config),
    centerlineLength: length,
    pressureDrop: pressureDropAt(velocity, dh, length, localCoefficient, mmToM(config.roughnessMm), air),
  };
}

function assertNever(x: never): never {
  throw new Error(`unknown fitting: ${JSON.stringify(x)}`);
}
