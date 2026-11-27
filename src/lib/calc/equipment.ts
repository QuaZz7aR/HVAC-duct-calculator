import { mmToM } from './units';

/**
 * Equipment (ADR 0120): an air handling unit, a duct heater, fan or cooler. No metal is made for it; only its insulation is counted.
 * Sizes in mm: the outer casing length x width x height and the duct openings on its faces (usually 2 or 4).
 */
export type EquipmentOpening = { shape: 'round'; diameter: number } | { shape: 'rect'; width: number; height: number };

export interface Equipment {
  length: number;
  width: number;
  height: number;
  openings: EquipmentOpening[];
}

/** Area of one opening in m2. */
export function openingArea(o: EquipmentOpening): number {
  // circle pi d^2 / 4, or the rectangle a x b
  return o.shape === 'round' ? (Math.PI * mmToM(o.diameter) ** 2) / 4 : mmToM(o.width) * mmToM(o.height);
}

/**
 * Insulation area of one piece of equipment in m2 for a layer `t` mm thick: the outer surface of the layer around the casing
 * (each of the three sizes + 2t, as on the ducts, ADR 0037) minus the duct openings.
 * TODO(confirm): the openings are taken at their own size; the duct's own insulation, which butts against the casing, is not subtracted.
 */
export function equipmentInsulationArea(e: Equipment, t: number): number {
  if (!Number.isFinite(t) || t <= 0) {
    throw new Error(`invalid insulation thickness: ${t}`);
  }
  const l = mmToM(e.length + 2 * t), w = mmToM(e.width + 2 * t), h = mmToM(e.height + 2 * t);
  // six faces of the box 2(lw + lh + wh), less the openings
  const box = 2 * (l * w + l * h + w * h);
  return box - e.openings.reduce((sum, o) => sum + openingArea(o), 0);
}
