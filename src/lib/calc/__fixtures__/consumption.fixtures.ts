import type { Fitting } from '../types';

/**
 * Metal consumption vs actual area (engineer 2026-11-16, ADR 0042), no waste factor (default config, elbows not used here).
 * Reducers shorter than 300 mm are cut as 300 mm long; tees and crosses do not subtract the branch cut-out.
 *   round reducer d315/d200, L 150 -> 300, allowance 50 x 2: pi * 0.2575 * (sqrt(0.3^2 + 0.0575^2) + 0.1) = 0.328001546
 *     (actual at L 150: pi * 0.2575 * (sqrt(0.15^2 + 0.0575^2) + 0.1) = 0.210849982)
 *   round reducer d315/d200, L 400 (already longer): consumption = actual = 0.407806239
 *   rect reducer 500x300/300x200, L 200 -> 300, allowance 30 x 2:
 *     (0.5 + 0.3) sqrt(0.3^2 + 0.05^2) + (0.3 + 0.2) sqrt(0.3^2 + 0.1^2) + 1.3 * 0.06 = 0.479424384 (actual 0.354727624)
 *   rect-to-round 400x300/d250, L 150 -> 300, allowance 50 x 2: exact layout (ADR 0035) at L 0.3, cones by a 200 000-step midpoint sum,
 *     + mean perimeter 1.092699 * 0.1 = 0.446773075
 *   round tee d200/d150, allowance 50: run pi * 0.2 * (0.15 + 0.1) + collar pi * 0.15 * 0.05 = 0.180641578, no cut-out
 *   rect cross 400x300/d250, allowance 40: run 1.4 * (0.25 + 0.08) + 2 collars 2 * pi * 0.25 * 0.04 = 0.524831853, no cut-outs
 */
export interface ConsumptionCase {
  id: string;
  input: Fitting;
  consumption: number; // m2, consumptionArea (no waste factor)
  basis: 'geometry';
}

export const consumptionCases: ConsumptionCase[] = [
  { id: 'round-reducer-d315-d200-l150', input: { kind: 'roundReducer', diameter: 315, smallDiameter: 200, length: 150, allowance: 50 }, consumption: 0.328001546, basis: 'geometry' },
  { id: 'round-reducer-d315-d200-l400', input: { kind: 'roundReducer', diameter: 315, smallDiameter: 200, length: 400, allowance: 50 }, consumption: 0.407806239, basis: 'geometry' },
  { id: 'rect-reducer-500x300-300x200-l200', input: { kind: 'rectReducer', width: 500, height: 300, smallWidth: 300, smallHeight: 200, length: 200, allowance: 30 }, consumption: 0.479424384, basis: 'geometry' },
  { id: 'rect-to-round-400x300-d250-l150', input: { kind: 'rectToRoundReducer', width: 400, height: 300, smallDiameter: 250, length: 150, allowance: 50 }, consumption: 0.446773075, basis: 'geometry' },
  { id: 'round-tee-d200-d150', input: { kind: 'roundTee', diameter: 200, branchDiameter: 150, allowance: 50 }, consumption: 0.180641578, basis: 'geometry' },
  { id: 'rect-cross-400x300-d250', input: { kind: 'rectCrossRoundBranches', width: 400, height: 300, branchDiameter: 250, allowance: 40 }, consumption: 0.524831853, basis: 'geometry' },
];
