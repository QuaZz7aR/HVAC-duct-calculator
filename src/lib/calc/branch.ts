import type { Fitting } from './types';
import { rectSaddle, roundSaddle } from './saddle';
import { mmToM } from './units';

export type TeeCross = Extract<
  Fitting,
  {
    kind:
      | 'roundTee' | 'roundTeeRectBranch' | 'rectTee' | 'rectTeeRoundBranch'
      | 'roundCross' | 'roundCrossRectBranches' | 'rectCross' | 'rectCrossRoundBranches';
  }
>;

export const isTeeCross = (f: Fitting): f is TeeCross => f.kind.includes('Tee') || f.kind.includes('Cross');

/** Tee or cross in m and m2: main perimeter and flow area, branch perimeter and cut-out, number of branches, run length. */
export function branchLayout(f: TeeCross) {
  const allowance = mmToM(f.allowance);
  const count = f.kind.includes('Cross') ? 2 : 1;
  const round = 'diameter' in f;
  const mainPerimeter = round ? Math.PI * mmToM(f.diameter) : 2 * (mmToM(f.width) + mmToM(f.height));
  const mainArea = round ? (Math.PI * mmToM(f.diameter) ** 2) / 4 : mmToM(f.width) * mmToM(f.height);
  const roundBranch = 'branchDiameter' in f;
  const branchPerimeter = roundBranch
    ? Math.PI * mmToM(f.branchDiameter)
    : 2 * (mmToM(f.branchWidth) + mmToM(f.branchHeight));
  const branchArea = roundBranch
    ? (Math.PI * mmToM(f.branchDiameter) ** 2) / 4
    : mmToM(f.branchWidth) * mmToM(f.branchHeight);
  const along = roundBranch ? mmToM(f.branchDiameter) : mmToM(f.branchWidth);
  // the allowance is the extra wall at each counted end of the run (`allowanceCount`, default 2) AND the length of each branch collar
  // the saddle of each branch on a round main, when chosen (ADR 0118); 0 on a flat wall
  const R = round ? mmToM(f.diameter) / 2 : 0;
  const saddle = round && 'saddle' in f && f.saddle === 1
    ? (roundBranch ? roundSaddle(R, mmToM(f.branchDiameter) / 2) : rectSaddle(R, mmToM(f.branchWidth), mmToM(f.branchHeight)))
    : 0;
  return { saddle, count, mainPerimeter, mainArea, branchPerimeter, branchArea, along, collar: allowance, runLength: along + (f.allowanceCount ?? 2) * allowance };
}
