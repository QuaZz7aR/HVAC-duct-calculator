import type { Fitting } from './types';
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
  // the allowance is the extra wall at each end of the run AND the length of each branch collar
  return { count, mainPerimeter, mainArea, branchPerimeter, branchArea, along, collar: allowance, runLength: along + 2 * allowance };
}
