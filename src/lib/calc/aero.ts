import type { AirConditions, DuctSection, PressureDrop } from './types';
import { m3hToM3s, mmToM } from './units';

export function pressureDrop(section: DuctSection, air: AirConditions): PressureDrop {
  let area: number;
  let dh: number;
  switch (section.shape) {
    case 'round':
      // circle: flow area and hydraulic diameter is the diameter itself
      area = (Math.PI * mmToM(section.diameter) ** 2) / 4;
      dh = mmToM(section.diameter);
      break;
    case 'rect': {
      // rectangle: flow area W*H, hydraulic diameter 2WH/(W+H)
      const w = mmToM(section.width);
      const h = mmToM(section.height);
      area = w * h;
      dh = (2 * w * h) / (w + h);
      break;
    }
    default:
      return assertNever(section);
  }

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
