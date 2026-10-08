import type { AirConditions, DuctSection, PressureDrop } from './types';
import { m3hToM3s, mmToM } from './units';

/** Flow cross-section in SI: area m2 and hydraulic diameter m. */
export interface Opening {
  area: number;
  dh: number;
}

/** Throws on a non-positive or non-finite size in mm. */
function checkSize(...sizes: number[]): void {
  if (sizes.some((s) => !Number.isFinite(s) || s <= 0)) {
    throw new Error(`invalid duct size: ${sizes.join(' x ')} mm`);
  }
}

export function roundOpening(diameter: number): Opening {
  checkSize(diameter);
  const d = mmToM(diameter);
  // circle: flow area pi d^2 / 4, hydraulic diameter is the diameter itself
  return { area: (Math.PI * d ** 2) / 4, dh: d };
}

export function rectOpening(width: number, height: number): Opening {
  checkSize(width, height);
  const w = mmToM(width);
  const h = mmToM(height);
  // rectangle: flow area W*H, hydraulic diameter 2WH/(W+H)
  return { area: w * h, dh: (2 * w * h) / (w + h) };
}

export function pressureDrop(section: DuctSection, air: AirConditions): PressureDrop {
  let opening: Opening;
  switch (section.shape) {
    case 'round':
      opening = roundOpening(section.diameter);
      break;
    case 'rect':
      opening = rectOpening(section.width, section.height);
      break;
    default:
      return assertNever(section);
  }
  const { area, dh } = opening;
  const velocity = m3hToM3s(section.flow) / area;
  return pressureDropAt(velocity, dh, mmToM(section.length), section.localCoefficient, mmToM(section.roughness), air);
}

/** Pressure drop for a given mean velocity and hydraulic diameter; SI only (m/s, m, Pa). */
export function pressureDropAt(
  velocity: number,
  dh: number,
  length: number,
  localCoefficient: number,
  roughness: number,
  air: AirConditions,
): PressureDrop {
  const reynolds = (velocity * dh) / air.kinematicViscosity;
  const dynamicPressure = (air.density * velocity ** 2) / 2;
  // Altshul friction factor with relative roughness k/dh
  const frictionFactor = 0.11 * (roughness / dh + 68 / reynolds) ** 0.25;
  // friction loss along the centerline length, local loss by the summed zeta
  const frictionLoss = (frictionFactor / dh) * dynamicPressure * length;
  const localLoss = localCoefficient * dynamicPressure;

  return { velocity, reynolds, dynamicPressure, frictionFactor, frictionLoss, localLoss };
}

function assertNever(x: never): never {
  throw new Error(`unknown section: ${JSON.stringify(x)}`);
}
