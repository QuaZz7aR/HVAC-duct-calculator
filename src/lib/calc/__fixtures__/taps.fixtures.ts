/**
 * Reference values for the sheet-metal area of standalone branch-in collars (Excel Квр, Пвр). SOURCE OF TRUTH - do not edit expected values to make a test pass.
 *
 * - Sizes in mm, `area` in m2, pure geometry: no cutting-waste factor, Math.PI.
 * - Model: a tap is a short stub inserted into a cut-out of a main duct: area = perimeter x length.
 *     The cut-out in the main duct is NOT subtracted (owner decision 2026-10-19); the Excel "ring" term pi(d/2+50)^2 - pi d^2/4 of Квр is not used
 *     (it contradicts the definition of `allowance`), and the Пвр collar as a difference of perimeters is a formula error.
 * - `specM2` is the figure of the engineer's real specification (Спецификация_воздуховодов_Квартира_Киев_29_11_2021.xlsx, Лист1 rows 31-33), rounded by him
 *   to 0.01 m2; kept next to the geometry for comparison only, tests assert `area`.
 */
import type {Fitting} from '../types';

export interface TapCase {
    id: string;
    input: Fitting;
    area: number;
    thicknessMm: number; // default DBN table: round by diameter, rect by the larger side
    specM2?: number;
    note?: string;
}

export const tapCases: TapCase[] = [
    {
        id: 'round-tap-d150-l100',
        input: {kind: 'roundTap', diameter: 150, length: 100},
        area: 0.047123890, // pi * 0.15 * 0.1
        thicknessMm: 0.5,
        specM2: 0.05, // "Врезка Д150"
    },
    {
        id: 'round-tap-d100-l100',
        input: {kind: 'roundTap', diameter: 100, length: 100},
        area: 0.031415927, // pi * 0.1 * 0.1
        thicknessMm: 0.5,
        specM2: 0.02, // "Врезка Д100"
        note: 'the specification gives 0.02, i.e. about 65 mm of length; the length is an input here',
    },
    {
        id: 'round-tap-d200-l100',
        input: {kind: 'roundTap', diameter: 200, length: 100},
        area: 0.062831853, // pi * 0.2 * 0.1
        thicknessMm: 0.5, // DBN round <= 200
    },
    {
        id: 'rect-tap-300x100-l100',
        input: {kind: 'rectTap', width: 300, height: 100, length: 100},
        area: 0.08, // 2 * (0.3 + 0.1) * 0.1
        thicknessMm: 0.7, // DBN rect, larger side 300 in (250, 1000]
        specM2: 0.07, // "Врезка 300х100"
    },
    {
        id: 'rect-tap-200x150-l120',
        input: {kind: 'rectTap', width: 200, height: 150, length: 120},
        area: 0.084, // 2 * (0.2 + 0.15) * 0.12
        thicknessMm: 0.5, // DBN rect, larger side 200 <= 250
    },
];
