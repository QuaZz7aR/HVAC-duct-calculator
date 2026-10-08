import { pressureDropAt } from './aero';
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

/** Flow cross-section in SI: area m2 and hydraulic diameter m. */
interface Opening {
  area: number;
  dh: number;
}

const round = (diameter: number): Opening => {
  const d = mmToM(diameter);
  // circle: flow area pi d^2 / 4, hydraulic diameter is the diameter itself
  return { area: (Math.PI * d ** 2) / 4, dh: d };
};

const rect = (width: number, height: number): Opening => {
  const w = mmToM(width);
  const h = mmToM(height);
  // rectangle: flow area W*H, hydraulic diameter 2WH/(W+H)
  return { area: w * h, dh: (2 * w * h) / (w + h) };
};

/** One opening for constant-section fittings, both ends for reducers. */
function openings(f: Fitting): [Opening] | [Opening, Opening] {
  switch (f.kind) {
    case 'roundStraight':
    case 'roundCap':
    case 'roundElbow':
      return [round(f.diameter)];
    case 'rectStraight':
    case 'rectCap':
    case 'rectElbow':
      return [rect(f.width, f.height)];
    case 'roundReducer':
      return [round(f.diameter), round(f.smallDiameter)];
    case 'rectReducer':
      return [rect(f.width, f.height), rect(f.smallWidth, f.smallHeight)];
    case 'rectToRoundReducer':
      return [rect(f.width, f.height), round(f.smallDiameter)];
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
  const q = m3hToM3s(flow);
  const ends = openings(fitting);
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
