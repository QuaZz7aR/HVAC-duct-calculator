import type { CalcConfig, InsulationMaterial } from './config';
import { sheetArea } from './sheet-area';
import type { Fitting, SheetListItem } from './types';
import { mmToM } from './units';
import { wasteFactor } from './waste-factor';

/**
 * The outer surface of an insulation layer `t` mm thick, as a fitting: every cross-section size grows by 2t, the centre line stays.
 * Lengths and allowances are unchanged, so `developedLength` stays the one shared geometry (an elbow keeps its centre-line arc).
 */
export function insulated(f: Fitting, t: number): Fitting {
  const d = 2 * t;
  switch (f.kind) {
    case 'roundStraight':
    case 'roundCap':
    case 'roundTap':
      return { ...f, diameter: f.diameter + d };
    case 'rectStraight':
    case 'rectCap':
    case 'rectTap':
      return { ...f, width: f.width + d, height: f.height + d };
    case 'roundElbow':
      // the centre-line radius is the same for the duct and its insulation
      return { ...f, diameter: f.diameter + d };
    case 'rectElbow':
      // inner radius shrinks by t, so the centre-line radius (inner + width / 2) is unchanged
      return { ...f, width: f.width + d, height: f.height + d, innerRadius: f.innerRadius - t };
    case 'roundReducer':
      return { ...f, diameter: f.diameter + d, smallDiameter: f.smallDiameter + d };
    case 'rectReducer':
      return { ...f, width: f.width + d, height: f.height + d, smallWidth: f.smallWidth + d, smallHeight: f.smallHeight + d };
    case 'rectToRoundReducer':
      return { ...f, width: f.width + d, height: f.height + d, smallDiameter: f.smallDiameter + d };
    case 'roundTee':
    case 'roundCross':
      return { ...f, diameter: f.diameter + d, branchDiameter: f.branchDiameter + d };
    case 'roundTeeRectBranch':
    case 'roundCrossRectBranches':
      return { ...f, diameter: f.diameter + d, branchWidth: f.branchWidth + d, branchHeight: f.branchHeight + d };
    case 'rectTee':
    case 'rectCross':
      return { ...f, width: f.width + d, height: f.height + d, branchWidth: f.branchWidth + d, branchHeight: f.branchHeight + d };
    case 'rectTeeRoundBranch':
    case 'rectCrossRoundBranches':
      return { ...f, width: f.width + d, height: f.height + d, branchDiameter: f.branchDiameter + d };
    default:
      return assertNever(f);
  }
}

/**
 * Insulation area of one piece in m2: the outer surface of the layer, the elbow cutting coefficient included (as in the Excel).
 * The seam allowance is metal only. A cap is insulated on its end plate only: its skirt sits on the duct, which is insulated itself.
 */
export function insulationArea(f: Fitting, t: number, config: CalcConfig): number {
  if (!Number.isFinite(t) || t <= 0) {
    throw new Error(`invalid insulation thickness: ${t}`);
  }
  const outer = insulated(f, t);
  switch (outer.kind) {
    case 'roundCap':
      // end disc of the outer diameter
      return (Math.PI * mmToM(outer.diameter) ** 2) / 4;
    case 'rectCap':
      // end plate of the outer size
      return mmToM(outer.width) * mmToM(outer.height);
    case 'roundElbow':
    case 'rectElbow':
      // TODO(confirm): the Excel applies the metal cutting coefficient to insulation of elbows too
      return sheetArea(outer) * wasteFactor(f, config);
    default:
      return sheetArea(outer);
  }
}

/** One insulation line of the input: a fitting, how many, and its material. */
export interface InsulationItem extends SheetListItem {
  material: InsulationMaterial;
}

/** Insulation of one material. */
export interface InsulationGroup {
  code: string;
  thicknessMm: number;
  area: number; // m2, times quantity
}

/** Insulation area per material, in the order of `config.insulation.materials`. */
export function insulationList(items: InsulationItem[], config: CalcConfig): InsulationGroup[] {
  const byCode = new Map<string, number>();
  for (const { fitting, quantity, material } of items) {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error(`quantity must be a positive integer: ${quantity}`);
    }
    byCode.set(material.code, (byCode.get(material.code) ?? 0) + quantity * insulationArea(fitting, material.thicknessMm, config));
  }
  return config.insulation.materials
    .filter((m) => byCode.has(m.code))
    .map((m) => ({ code: m.code, thicknessMm: m.thicknessMm, area: byCode.get(m.code)! }));
}

function assertNever(x: never): never {
  throw new Error(`unknown fitting: ${JSON.stringify(x)}`);
}
