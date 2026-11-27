/**
 * Boundary types of the calculation core.
 * Linear sizes are in millimetres, angles in degrees, flow in m3/h.
 * Everything inside the core is converted to SI (see units.ts) - never mix the two.
 */

/**
 * How many connection ends get the allowance (engineer 2026-11-16, ADR 0041): 2 = both ends (the default), 1 = one end, 0 = none.
 * Absent = 2. On tees and crosses it counts the ends of the main run; the branch collar length stays `allowance`.
 */
export type AllowanceCount = 0 | 1 | 2;

export type Fitting =
  | { kind: 'roundStraight'; diameter: number; length: number }
  | { kind: 'rectStraight'; width: number; height: number; length: number }
  // Dampers and check valves (ADR 0120): a bought or shop-made unit, counted by pieces; only its casing is a short duct
  // `length` long (form prefill `config.valve`, TODO(confirm)), so metal and insulation are those of a straight of that length.
  | { kind: 'roundDamper'; diameter: number; length: number }
  | { kind: 'rectDamper'; width: number; height: number; length: number }
  | { kind: 'roundCheckValve'; diameter: number; length: number }
  | { kind: 'rectCheckValve'; width: number; height: number; length: number }
  | { kind: 'roundCap'; diameter: number; length: number }
  | { kind: 'rectCap'; width: number; height: number; length: number }
  // Standalone branch-in collar (Excel Квр, Пвр): a short stub inserted into a cut-out of a main duct; `length` is the stub length (default 100 mm in the form).
  // The cut-out in the main duct is NOT subtracted here (owner decision 2026-10-19).
  // `mainDiameter` (absent = a flat wall): the tap sits on a round main and gets its saddle (ADR 0118); rect taps: width along the main
  | { kind: 'roundTap'; diameter: number; length: number; mainDiameter?: number }
  | { kind: 'rectTap'; width: number; height: number; length: number; mainDiameter?: number }
  | { kind: 'roundElbow'; diameter: number; centerRadius: number; angle: number; allowance: number; allowanceCount?: AllowanceCount }
  | {
      kind: 'rectElbow';
      width: number; // size in the bend plane
      height: number;
      innerRadius: number; // NOTE: inner, not center - see CLAUDE.md "Open questions"
      angle: number;
      allowance: number;
      allowanceCount?: AllowanceCount;
    }
  | { kind: 'roundReducer'; diameter: number; smallDiameter: number; length: number; allowance: number; allowanceCount?: AllowanceCount }
  | {
      kind: 'rectReducer';
      width: number;
      height: number;
      smallWidth: number;
      smallHeight: number;
      length: number;
      allowance: number;
      allowanceCount?: AllowanceCount;
    }
  | {
      kind: 'rectToRoundReducer';
      width: number;
      height: number;
      smallDiameter: number;
      length: number;
      allowance: number;
      allowanceCount?: AllowanceCount;
    }
  // Tees and crosses (Excel КТ, КПТ, ПТ, ПКТ / КККр, КПКр, ПККр, ППКр): main run + one branch (tee) or two opposite branches (cross).
  // Main kind first, then the branch kind. `branchWidth` / `branchDiameter` is the branch size ALONG the main axis (the Excel column E);
  // the main run is that size + 2 x allowance long. `allowance` is also the branch collar length.
  | { kind: 'roundTee'; diameter: number; branchDiameter: number; allowance: number; allowanceCount?: AllowanceCount; saddle?: 0 | 1 }
  | { kind: 'roundTeeRectBranch'; diameter: number; branchWidth: number; branchHeight: number; allowance: number; allowanceCount?: AllowanceCount; saddle?: 0 | 1 }
  | { kind: 'rectTee'; width: number; height: number; branchWidth: number; branchHeight: number; allowance: number; allowanceCount?: AllowanceCount }
  | { kind: 'rectTeeRoundBranch'; width: number; height: number; branchDiameter: number; allowance: number; allowanceCount?: AllowanceCount }
  | { kind: 'roundCross'; diameter: number; branchDiameter: number; allowance: number; allowanceCount?: AllowanceCount; saddle?: 0 | 1 }
  | { kind: 'roundCrossRectBranches'; diameter: number; branchWidth: number; branchHeight: number; allowance: number; allowanceCount?: AllowanceCount; saddle?: 0 | 1 }
  | { kind: 'rectCross'; width: number; height: number; branchWidth: number; branchHeight: number; allowance: number; allowanceCount?: AllowanceCount }
  | { kind: 'rectCrossRoundBranches'; width: number; height: number; branchDiameter: number; allowance: number; allowanceCount?: AllowanceCount }
  // BETA (ADR 0113). Adapter / box (Excel «Адаптор»): rect box width x height x length; `ends` closed end plates (0 / 1 / 2),
  // `partitions` inner plates width x height (slot-diffuser adapters). Stubs and taps are separate rows (Квр, Пвр).
  // `openFaces` (absent = 0): one a₁ x L wall left open, e.g. the slot of a slot-diffuser adapter (ADR 0116)
  | { kind: 'rectBox'; width: number; height: number; length: number; ends: 0 | 1 | 2; partitions: number; openFaces?: 0 | 1 }
  // BETA (ADR 0113). Offsets («утка»): axial length `length`, shift `offset` of the axis. Rect: `width` is the side in the offset plane.
  | { kind: 'roundOffset'; diameter: number; length: number; offset: number; allowance: number; allowanceCount?: AllowanceCount }
  | { kind: 'rectOffset'; width: number; height: number; length: number; offset: number; allowance: number; allowanceCount?: AllowanceCount };

export interface AirConditions {
  density: number; // kg/m3
  kinematicViscosity: number; // m2/s
}

interface SectionBase {
  flow: number; // m3/h
  length: number; // mm, centerline length of the section
  localCoefficient: number; // sum of local resistance coefficients (zeta)
  roughness: number; // mm, absolute
}

export type DuctSection =
  | (SectionBase & { shape: 'round'; diameter: number })
  | (SectionBase & { shape: 'rect'; width: number; height: number });

export interface PressureDrop {
  velocity: number; // m/s
  reynolds: number;
  dynamicPressure: number; // Pa
  frictionFactor: number;
  frictionLoss: number; // Pa
  localLoss: number; // Pa
}

/** One line of the sheet list input: a fitting and how many identical pieces. */
export interface SheetListItem {
  fitting: Fitting;
  quantity: number; // pieces, positive integer
}

/** Metal of one sheet thickness. */
export interface ThicknessGroup {
  thicknessMm: number;
  area: number; // m2, including the cutting-waste factor, times quantity
}
