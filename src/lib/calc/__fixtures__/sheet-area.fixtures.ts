/**
 * Reference values for sheet-metal area. SOURCE OF TRUTH - do not edit expected values to make a test pass.
 *
 * - Sizes in mm, angles in degrees, `area` in m2, `centerline` in m.
 * - `area` is pure geometry: no cutting-waste factor (that one lives in config), Math.PI.
 * - The original Excel is a reference, not the source of truth: where its formulas are rough
 *   (reducers without slant, length clamp to 0.3 m, safety coefficients 1.15/1.2/1.1 on elbows),
 *   these values deliberately differ from it.
 * - `basis: 'geometry'` - derived independently from first principles.
 *   `basis: 'excel'` - a convention or approximation that is not independently verified
 *   (see the notes and CLAUDE.md "Open questions").
 */
import type {Fitting} from '../types';

export interface SheetAreaCase {
    id: string;
    excelCode: string; // position code in the original spreadsheet
    input: Fitting;
    area: number;
    basis: 'geometry' | 'excel';
    note?: string;
}

export const sheetAreaCases: SheetAreaCase[] = [
    {
        id: 'round-straight-d150-1m',
        excelCode: 'КВ',
        input: {kind: 'roundStraight', diameter: 150, length: 1000},
        area: 0.471238898,
        basis: 'geometry',
    },
    {
        id: 'round-straight-d355-1m',
        excelCode: 'КВ',
        input: {kind: 'roundStraight', diameter: 355, length: 1000},
        area: 1.115265392,
        basis: 'geometry',
        note: 'spiral-wound duct, same geometry',
    },
    {
        id: 'nipple-d315',
        excelCode: 'Ніпель',
        input: {kind: 'roundStraight', diameter: 315, length: 120},
        area: 0.118752202,
        basis: 'geometry',
        note: 'nipple is a short straight piece',
    },
    {
        id: 'rect-straight-300x300-8m',
        excelCode: 'ПВ',
        input: {kind: 'rectStraight', width: 300, height: 300, length: 8000},
        area: 9.6,
        basis: 'geometry',
    },
    {
        id: 'round-cap-d250',
        excelCode: 'Кз',
        input: {kind: 'roundCap', diameter: 250, length: 50},
        area: 0.088357293,
        basis: 'geometry',
        note: 'disc + short cylinder',
    },
    {
        id: 'rect-cap-350x150',
        excelCode: 'Пз',
        input: {kind: 'rectCap', width: 350, height: 150, length: 50},
        area: 0.1025,
        basis: 'geometry',
    },
    {
        id: 'round-elbow-d250-r250-90',
        excelCode: 'КО',
        input: {kind: 'roundElbow', diameter: 250, centerRadius: 250, angle: 90, allowance: 50},
        area: 0.386964954,
        basis: 'geometry',
        note: 'allowance counted at both ends',
    },
    {
        id: 'round-elbow-d400-r400-45',
        excelCode: 'КО',
        input: {kind: 'roundElbow', diameter: 400, centerRadius: 400, angle: 45, allowance: 50},
        area: 0.520447882,
        basis: 'geometry',
    },
    {
        id: 'rect-elbow-350x150-r125-90',
        excelCode: 'ПО',
        input: {kind: 'rectElbow', width: 350, height: 150, innerRadius: 125, angle: 90, allowance: 50},
        area: 0.571238898,
        basis: 'excel',
        note: 'R treated as INNER radius, as in the Excel formula. Allowance at both ends (confirmed by the author).',
    },
    {
        id: 'rect-elbow-400x200-r200-45',
        excelCode: 'ПО',
        input: {kind: 'rectElbow', width: 400, height: 200, innerRadius: 200, angle: 45, allowance: 50},
        area: 0.496991118,
        basis: 'excel',
        note: 'same convention as above',
    },
    {
        id: 'round-reducer-d150-d100',
        excelCode: 'КП',
        input: {kind: 'roundReducer', diameter: 150, smallDiameter: 100, length: 150, allowance: 50},
        area: 0.09898729,
        basis: 'geometry',
        note: 'cone area uses the slant height, not the axial length',
    },
    {
        id: 'round-reducer-d800-d400',
        excelCode: 'КП',
        input: {kind: 'roundReducer', diameter: 800, smallDiameter: 400, length: 300, allowance: 50},
        area: 0.868125963,
        basis: 'geometry',
        note: 'strong taper: axial length would underestimate the cone by ~17 %',
    },
    {
        id: 'rect-reducer-300x200-350x150',
        excelCode: 'ПП',
        input: {
            kind: 'rectReducer',
            width: 300,
            height: 200,
            smallWidth: 350,
            smallHeight: 150,
            length: 300,
            allowance: 50
        },
        area: 0.401039864,
        basis: 'geometry',
        note: 'slant uses the width offset only - accepted approximation for v1',
    },
    {
        id: 'rect-reducer-600x400-400x300',
        excelCode: 'ПП',
        input: {
            kind: 'rectReducer',
            width: 600,
            height: 400,
            smallWidth: 400,
            smallHeight: 300,
            length: 400,
            allowance: 50
        },
        area: 0.8617305,
        basis: 'geometry',
        note: 'exact: each face pair with its own slant',
    },
    {
        id: 'rect-to-round-200x150-d150',
        excelCode: 'ППК',
        input: {kind: 'rectToRoundReducer', width: 200, height: 150, smallDiameter: 150, length: 250, allowance: 50},
        area: 0.205697011,
        basis: 'excel',
        note: 'Project approximation: slant uses (width - diameter)/2 only. Excel uses axial length without slant. TODO(confirm)',
    },
    {
        id: 'rect-to-round-400x300-d250',
        excelCode: 'ППК',
        input: {kind: 'rectToRoundReducer', width: 400, height: 300, smallDiameter: 250, length: 400, allowance: 50},
        area: 0.553966216,
        basis: 'excel',
        note: 'Project approximation: slant uses (width - diameter)/2 only. Excel uses axial length without slant. TODO(confirm)',
    },
];

export interface CenterlineCase {
    id: string;
    input: Fitting;
    centerline: number;
}

/** Flow path length for aerodynamics. Independent of allowance, waste factor and sheet area. */
export const centerlineCases: CenterlineCase[] = [
    {id: 'round-straight-d150-1m', input: {kind: 'roundStraight', diameter: 150, length: 1000}, centerline: 1.0},
    {
        id: 'round-elbow-d250-r250-90',
        input: {kind: 'roundElbow', diameter: 250, centerRadius: 250, angle: 90, allowance: 50},
        centerline: 0.392699082
    },
    {
        id: 'round-elbow-d400-r400-45',
        input: {kind: 'roundElbow', diameter: 400, centerRadius: 400, angle: 45, allowance: 50},
        centerline: 0.314159265
    },
    {
        id: 'rect-elbow-350x150-r125-90',
        input: {kind: 'rectElbow', width: 350, height: 150, innerRadius: 125, angle: 90, allowance: 50},
        centerline: 0.471238898
    },
    {
        id: 'rect-elbow-400x200-r200-45',
        input: {kind: 'rectElbow', width: 400, height: 200, innerRadius: 200, angle: 45, allowance: 50},
        centerline: 0.314159265
    },
];
