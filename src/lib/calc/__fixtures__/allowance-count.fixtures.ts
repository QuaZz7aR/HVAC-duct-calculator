import type { Fitting } from '../types';

/**
 * Number of allowances per fitting (engineer 2026-11-16, ADR 0041): 2 (default), 1 or 0 connection ends get the allowance.
 * Each removed end takes away one strip of (mean) perimeter x allowance:
 *   round elbow d250: pi * 0.25 * 0.05 = 0.039269908; rect elbow 350x150: 2 * (0.35 + 0.15) * 0.05 = 0.05;
 *   round reducer d800/d400: mean circumference pi * 0.6 * 0.05 = 0.094247780;
 *   round tee d150/d150: the main run is 0.15 + n * 0.05 long, body = pi * 0.15 * run, the collar pi * 0.15 * 0.05 = 0.023561945 stays,
 *   the opening pi * 0.15^2 / 4 = 0.017671459 is subtracted.
 * The count-2 value equals the existing sheet-area fixture.
 */
export interface AllowanceCountCase {
  id: string;
  input: Fitting;
  area: number; // m2, sheetArea (no waste factor)
  basis: 'geometry';
}

export const allowanceCountCases: AllowanceCountCase[] = [
  { id: 'round-elbow-d250-n2', input: { kind: 'roundElbow', diameter: 250, centerRadius: 250, angle: 90, allowance: 50, allowanceCount: 2 }, area: 0.386964954, basis: 'geometry' },
  { id: 'round-elbow-d250-n1', input: { kind: 'roundElbow', diameter: 250, centerRadius: 250, angle: 90, allowance: 50, allowanceCount: 1 }, area: 0.347695046, basis: 'geometry' },
  // pi * 0.25 * (0.25 * pi / 2)
  { id: 'round-elbow-d250-n0', input: { kind: 'roundElbow', diameter: 250, centerRadius: 250, angle: 90, allowance: 50, allowanceCount: 0 }, area: 0.308425138, basis: 'geometry' },
  { id: 'rect-elbow-350x150-n1', input: { kind: 'rectElbow', width: 350, height: 150, innerRadius: 125, angle: 90, allowance: 50, allowanceCount: 1 }, area: 0.521238898, basis: 'geometry' },
  // cheeks (pi / 2)(0.475^2 - 0.125^2) + walls (pi / 2)(0.475 + 0.125) * 0.15
  { id: 'rect-elbow-350x150-n0', input: { kind: 'rectElbow', width: 350, height: 150, innerRadius: 125, angle: 90, allowance: 50, allowanceCount: 0 }, area: 0.471238898, basis: 'geometry' },
  { id: 'round-reducer-d800-d400-n1', input: { kind: 'roundReducer', diameter: 800, smallDiameter: 400, length: 300, allowance: 50, allowanceCount: 1 }, area: 0.773878183, basis: 'geometry' },
  // pi * 0.6 * sqrt(0.3^2 + 0.2^2)
  { id: 'round-reducer-d800-d400-n0', input: { kind: 'roundReducer', diameter: 800, smallDiameter: 400, length: 300, allowance: 50, allowanceCount: 0 }, area: 0.679630403, basis: 'geometry' },
  { id: 'round-tee-d150-n1', input: { kind: 'roundTee', diameter: 150, branchDiameter: 150, allowance: 50, allowanceCount: 1 }, area: 0.100138266, basis: 'geometry' },
  { id: 'round-tee-d150-n0', input: { kind: 'roundTee', diameter: 150, branchDiameter: 150, allowance: 50, allowanceCount: 0 }, area: 0.076576321, basis: 'geometry' },
];
