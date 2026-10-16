/**
 * Reference values for the sheet-metal area of tees and crosses. SOURCE OF TRUTH - do not edit expected values to make a test pass.
 *
 * - Sizes in mm, `area` in m2, `area` is pure geometry: no cutting-waste factor, Math.PI.
 * - Model (engineer's Excel, rows КТ, КПТ, ПТ, ПКТ and КККр, КПКр, ПККр, ППКр, with the opening subtracted everywhere):
 *     main run = main perimeter x (E + 2 x allowance), where E is the branch size ALONG the main axis (width or diameter);
 *     collar   = branch perimeter x allowance, once for a tee, twice for a cross (allowance = collar length too);
 *     opening  = branch cross-section area (flat), once for a tee, twice for a cross;
 *     area     = main run + collar - opening.
 * - Opening subtracted in every fitting: decided with the engineer 2026-10-16 (Ш7). The Excel formulas were corrected the same day
 *   (reports/template-fixed-m27-m30-2026-10-16.xlsx); the corrected cells give exactly these numbers.
 * - The opening is a flat cross-section area: the saddle-shaped cut on a round main is larger (about +6 % for d200 on D315,
 *   +8 % for a 300x200 rect branch). Known approximation, kept as in the Excel.
 * - `body`, `collar`, `opening` are the parts of `area`, listed so the arithmetic can be checked by hand; tests assert `area`.
 */
import type {Fitting} from '../types';

export interface TeeCrossCase {
    id: string;
    excelCode: string; // position code in the original spreadsheet
    input: Fitting;
    area: number;
    body: number;
    collar: number;
    opening: number;
    basis: 'geometry' | 'excel';
    note?: string;
}

export const teeCrossCases: TeeCrossCase[] = [
    {
        id: 'round-tee-d150-branch-d150',
        excelCode: 'КТ',
        input: {kind: 'roundTee', diameter: 150, branchDiameter: 150, allowance: 50},
        area: 0.123700211,
        body: 0.117809725, // pi * 0.15 * 0.25
        collar: 0.023561945, // pi * 0.15 * 0.05
        opening: 0.017671459, // pi * 0.15^2 / 4
        basis: 'excel',
    },
    {
        id: 'round-tee-d200-branch-300x100',
        excelCode: 'КПТ',
        input: {kind: 'roundTeeRectBranch', diameter: 200, branchWidth: 300, branchHeight: 100, allowance: 50},
        area: 0.261327412,
        body: 0.251327412, // pi * 0.2 * 0.4
        collar: 0.04, // 2 * (0.3 + 0.1) * 0.05
        opening: 0.03, // 0.3 * 0.1
        basis: 'excel',
    },
    {
        id: 'rect-tee-350x150-branch-350x150',
        excelCode: 'ПТ',
        input: {kind: 'rectTee', width: 350, height: 150, branchWidth: 350, branchHeight: 150, allowance: 50},
        area: 0.4475,
        body: 0.45, // 2 * (0.35 + 0.15) * 0.45
        collar: 0.05, // 2 * (0.35 + 0.15) * 0.05
        opening: 0.0525, // 0.35 * 0.15
        basis: 'excel',
    },
    {
        id: 'rect-tee-350x150-branch-d150',
        excelCode: 'ПКТ',
        input: {kind: 'rectTeeRoundBranch', width: 350, height: 150, branchDiameter: 150, allowance: 50},
        area: 0.255890486,
        body: 0.25, // 2 * (0.35 + 0.15) * 0.25
        collar: 0.023561945, // pi * 0.15 * 0.05
        opening: 0.017671459, // pi * 0.15^2 / 4
        basis: 'excel',
    },
    {
        id: 'round-cross-d315-branches-d200',
        excelCode: 'КККр',
        input: {kind: 'roundCross', diameter: 315, branchDiameter: 200, allowance: 50},
        area: 0.296880506,
        body: 0.296880506, // pi * 0.315 * 0.3
        collar: 0.062831853, // 2 * pi * 0.2 * 0.05
        opening: 0.062831853, // 2 * pi * 0.2^2 / 4 (equals the collar for d200 and allowance 50)
        basis: 'excel',
    },
    {
        id: 'round-cross-d315-branches-300x200',
        excelCode: 'КПКр',
        input: {kind: 'roundCrossRectBranches', diameter: 315, branchWidth: 300, branchHeight: 200, allowance: 50},
        area: 0.375840674,
        body: 0.395840674, // pi * 0.315 * 0.4
        collar: 0.1, // 2 * 2 * (0.3 + 0.2) * 0.05
        opening: 0.12, // 2 * 0.3 * 0.2
        basis: 'excel',
        note: 'Excel label says "round branches", the branches are rectangular (typo in the template)',
    },
    {
        id: 'rect-cross-400x300-branches-d250',
        excelCode: 'ПККр',
        input: {kind: 'rectCrossRoundBranches', width: 400, height: 300, branchDiameter: 250, allowance: 50},
        area: 0.470365046,
        body: 0.49, // 2 * (0.4 + 0.3) * 0.35
        collar: 0.078539816, // 2 * pi * 0.25 * 0.05
        opening: 0.09817477, // 2 * pi * 0.25^2 / 4
        basis: 'excel',
        note: 'Excel template formula was wrong (units mixed); value is from the corrected formula',
    },
    {
        id: 'rect-cross-600x500-branches-600x300',
        excelCode: 'ППКр',
        input: {kind: 'rectCross', width: 600, height: 500, branchWidth: 600, branchHeight: 300, allowance: 50},
        area: 1.36,
        body: 1.54, // 2 * (0.6 + 0.5) * 0.7
        collar: 0.18, // 2 * 2 * (0.6 + 0.3) * 0.05
        opening: 0.36, // 2 * 0.6 * 0.3
        basis: 'excel',
        note: 'Excel template formula was wrong (collar length missing); value is from the corrected formula',
    },
];
