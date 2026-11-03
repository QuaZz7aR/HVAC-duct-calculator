/**
 * Reference values for the insulation area (beta, 2026-11-03). SOURCE OF TRUTH - do not edit expected values to make a test pass.
 *
 * - Sizes in mm, `area` in m2 of one piece, Math.PI. `thicknessMm` is the insulation layer t.
 * - Model (the engineer's Excel «Шаблон», columns P-U, with exact geometry where the Excel is rough): the outer surface of the layer =
 *   the metal geometry with every cross-section size + 2t; lengths, allowances and the centre line of elbows unchanged.
 *   Elbows keep the metal cutting coefficient (round 1.15 below 315, rect 1.1 from an equivalent diameter of 250), as in the Excel.
 *   Caps: the end plate of the outer size only (the Excel); tees and crosses: geometry + 2t, the outer branch cut-out subtracted
 *   (the Excel uses metal x 1.2 for crosses, not followed). No seam allowance.
 * - Values computed by hand formulas in Python, independent of the code.
 */
import type { Fitting } from '../types';

export interface InsulationCase {
  id: string;
  input: Fitting;
  thicknessMm: number;
  area: number;
}

export const insulationCases: InsulationCase[] = [
  {
    id: 'round-straight-d150-l1000-kf10',
    input: { kind: 'roundStraight', diameter: 150, length: 1000 },
    thicknessMm: 10,
    area: 0.534070751, // pi * 0.17 * 1
  },
  {
    id: 'rect-straight-500x300-l1000-mf30',
    input: { kind: 'rectStraight', width: 500, height: 300, length: 1000 },
    thicknessMm: 30,
    area: 1.84, // 2 * (0.56 + 0.36) * 1
  },
  {
    id: 'round-elbow-d200-r200-90-p50-kf10',
    input: { kind: 'roundElbow', diameter: 200, centerRadius: 200, angle: 90, allowance: 50 },
    thicknessMm: 10,
    area: 0.329183285, // pi * 0.22 * (0.2 * pi / 2 + 2 * 0.05) * 1.15
  },
  {
    id: 'rect-elbow-400x200-ri100-90-p50-kf13',
    input: { kind: 'rectElbow', width: 400, height: 200, innerRadius: 100, angle: 90, allowance: 50 },
    thicknessMm: 13,
    area: 0.819385075, // 2 * (0.426 + 0.226) * (0.3 * pi / 2 + 0.1) * 1.1; centre R = 0.1 + 0.2 stays
  },
  {
    id: 'round-reducer-d250-d160-l300-p50-kf10',
    input: { kind: 'roundReducer', diameter: 250, smallDiameter: 160, length: 300, allowance: 50 },
    thicknessMm: 10,
    area: 0.285115715, // pi * (0.27 + 0.18) / 2 * (sqrt(0.3^2 + 0.045^2) + 0.1)
  },
  {
    id: 'rect-reducer-400x300-300x200-l300-p50-kf10',
    input: { kind: 'rectReducer', width: 400, height: 300, smallWidth: 300, smallHeight: 200, length: 300, allowance: 50 },
    thicknessMm: 10,
    area: 0.517296802, // (0.42 + 0.32) sqrt(0.3^2 + 0.05^2) + (0.32 + 0.22) sqrt(0.3^2 + 0.05^2) + 1.28 * 0.1
  },
  {
    id: 'rect-to-round-500x300-d200-l300-p50-kf10',
    input: { kind: 'rectToRoundReducer', width: 500, height: 300, smallDiameter: 200, length: 300, allowance: 50 },
    thicknessMm: 10,
    area: 0.501787433, // exact layout of 520 x 320 -> d220 (ADR 0035, Simpson n = 20000) + (2 * 0.84 + pi * 0.22) * 0.05
  },
  {
    id: 'round-cap-d200-l50-kf10',
    input: { kind: 'roundCap', diameter: 200, length: 50 },
    thicknessMm: 10,
    area: 0.038013271, // pi * 0.22^2 / 4, end disc only
  },
  {
    id: 'rect-cap-300x200-l50-kf10',
    input: { kind: 'rectCap', width: 300, height: 200, length: 50 },
    thicknessMm: 10,
    area: 0.0704, // 0.32 * 0.22, end plate only
  },
  {
    id: 'round-tap-d150-l100-kf10',
    input: { kind: 'roundTap', diameter: 150, length: 100 },
    thicknessMm: 10,
    area: 0.053407075, // pi * 0.17 * 0.1
  },
  {
    id: 'round-tee-d200-d150-p50-kf10',
    input: { kind: 'roundTee', diameter: 200, branchDiameter: 150, allowance: 50 },
    thicknessMm: 10,
    area: 0.190616134, // pi * 0.22 * (0.17 + 0.1) + pi * 0.17 * 0.05 - pi * 0.17^2 / 4
  },
  {
    id: 'rect-cross-400x300-200x150-p50-kf10',
    input: { kind: 'rectCross', width: 400, height: 300, branchWidth: 200, branchHeight: 150, allowance: 50 },
    thicknessMm: 10,
    area: 0.4768, // 2 * (0.42 + 0.32) * (0.22 + 0.1) + 2 * (2 * (0.22 + 0.17) * 0.05 - 0.22 * 0.17)
  },
];
