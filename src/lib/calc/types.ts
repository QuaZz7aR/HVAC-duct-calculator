/**
 * Boundary types of the calculation core.
 * Linear sizes are in millimetres, angles in degrees, flow in m3/h.
 * Everything inside the core is converted to SI (see units.ts) - never mix the two.
 */

export type Fitting =
  | { kind: 'roundStraight'; diameter: number; length: number }
  | { kind: 'rectStraight'; width: number; height: number; length: number }
  | { kind: 'roundCap'; diameter: number; length: number }
  | { kind: 'rectCap'; width: number; height: number; length: number }
  | { kind: 'roundElbow'; diameter: number; centerRadius: number; angle: number; allowance: number }
  | {
      kind: 'rectElbow';
      width: number; // size in the bend plane
      height: number;
      innerRadius: number; // NOTE: inner, not center - see CLAUDE.md "Open questions"
      angle: number;
      allowance: number;
    }
  | { kind: 'roundReducer'; diameter: number; smallDiameter: number; length: number; allowance: number }
  | {
      kind: 'rectReducer';
      width: number;
      height: number;
      smallWidth: number;
      smallHeight: number;
      length: number;
      allowance: number;
    }
  | {
      kind: 'rectToRoundReducer';
      width: number;
      height: number;
      smallDiameter: number;
      length: number;
      allowance: number;
    };

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
