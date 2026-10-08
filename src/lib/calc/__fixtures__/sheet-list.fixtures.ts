/**
 * Reference values for the sheet list: fittings with quantities -> metal area grouped by sheet thickness.
 * SOURCE OF TRUTH - do not edit expected values to make a test pass.
 *
 * Boundary: mm in, m2 out (areas include the cutting-waste factor, per `metalArea`).
 * Each piece's area comes from an already verified fixture (section.fixtures.ts, waste-factor / sheet-area fixtures)
 * or, for the plain straight ducts added here, from the one-line geometry shown in `derivation`.
 * Group area = sum over its items of quantity x metalArea(one piece). Thickness comes from the placeholder
 * table in defaultConfig (< 400 -> 0.55, >= 400 -> 0.7; rect by the LARGER side). Groups are ordered by ascending thickness.
 * The Excel ("Специфікація") has no grouping: it prints thickness (L) and area (M, N = K * M) per row; the grouping is ours.
 */
import type { Fitting } from '../types';
import type { ThicknessSize } from '../thickness';

export interface SheetListCase {
    id: string;
    items: { fitting: Fitting; quantity: number }[];
    expected: { thicknessMm: number; area: number }[];
    derivation: string;
}

export const sheetListCases: SheetListCase[] = [
    {
        id: 'mixed-two-thicknesses',
        items: [
            { fitting: { kind: 'roundStraight', diameter: 150, length: 1000 }, quantity: 3 },
            { fitting: { kind: 'rectStraight', width: 350, height: 150, length: 450 }, quantity: 4 },
            { fitting: { kind: 'roundElbow', diameter: 150, centerRadius: 150, angle: 90, allowance: 50 }, quantity: 2 },
            { fitting: { kind: 'rectCap', width: 350, height: 150, length: 50 }, quantity: 1 },
            { fitting: { kind: 'rectReducer', width: 600, height: 400, smallWidth: 400, smallHeight: 300, length: 400, allowance: 50 }, quantity: 2 },
            { fitting: { kind: 'roundStraight', diameter: 400, length: 1000 }, quantity: 1 },
            { fitting: { kind: 'rectStraight', width: 400, height: 300, length: 1000 }, quantity: 2 },
        ],
        expected: [
            { thicknessMm: 0.55, area: 3.679977654 },
            { thicknessMm: 0.7, area: 5.780098061 },
        ],
        derivation:
            'pieces (m2): round d150 1 m = 0.471238898 (section round-straight-d150-1m); rect 350x150 L450 = 0.45 (section rect-straight-350x150-450); ' +
            'round elbow d150 = 0.18188048 (section round-elbow-d150-r150-90); rect cap 350x150 = 0.1025 (section rect-cap-350x150); ' +
            'rect reducer 600x400-400x300 = 0.8617305 (section rect-reducer-600x400-400x300-L400); ' +
            'round straight d400 1 m = pi * 0.4 * 1 = 1.256637061 (x 1.0); rect straight 400x300 1 m = 2 * (0.4 + 0.3) * 1 = 1.4 (x 1.0). ' +
            '0.55 mm (D 150 round; rect larger sides 350 and 350; elbow D150; cap larger side 350): 3 * 0.471238898 + 4 * 0.45 + 2 * 0.18188048 + 0.1025 = 1.413716694 + 1.8 + 0.36376096 + 0.1025 = 3.679977654. ' +
            '0.7 mm (reducer larger side 600; round d400 is on the >= 400 boundary; rect 400x300 larger side 400, the Excel would give 0.55 via Dh 343): ' +
            '2 * 0.8617305 + 1.256637061 + 2 * 1.4 = 1.723461 + 1.256637061 + 2.8 = 5.780098061.',
    },
    {
        id: 'single-thickness',
        items: [
            { fitting: { kind: 'roundStraight', diameter: 150, length: 1000 }, quantity: 1 },
            { fitting: { kind: 'rectCap', width: 350, height: 150, length: 50 }, quantity: 5 },
        ],
        expected: [{ thicknessMm: 0.55, area: 0.983738898 }],
        derivation: '0.471238898 + 5 * 0.1025 = 0.471238898 + 0.5125 = 0.983738898. No 0.7 group: groups with no items are not listed.',
    },
    {
        id: 'empty',
        items: [],
        expected: [],
        derivation: 'no items -> no groups.',
    },
];

/**
 * Which size of each fitting keys the thickness lookup (Excel "Шаблон", column L uses the C/D = larger end for every kind).
 * Reducers: the larger end. rectToRoundReducer: the rect end (width/height are its large end), as in the Excel.
 * The thickness values follow the placeholder table (< 400 -> 0.55, >= 400 -> 0.7).
 * Each case is chosen so that using the wrong end gives a different thickness.
 */
export interface ThicknessSizeCase {
    id: string;
    fitting: Fitting;
    size: ThicknessSize;
    thickness: number;
}

export const thicknessSizeCases: ThicknessSizeCase[] = [
    { id: 'round-straight', fitting: { kind: 'roundStraight', diameter: 400, length: 1000 }, size: { shape: 'round', diameter: 400 }, thickness: 0.7 },
    { id: 'rect-straight', fitting: { kind: 'rectStraight', width: 300, height: 400, length: 1000 }, size: { shape: 'rect', width: 300, height: 400 }, thickness: 0.7 },
    { id: 'round-cap', fitting: { kind: 'roundCap', diameter: 250, length: 50 }, size: { shape: 'round', diameter: 250 }, thickness: 0.55 },
    { id: 'rect-cap', fitting: { kind: 'rectCap', width: 350, height: 150, length: 50 }, size: { shape: 'rect', width: 350, height: 150 }, thickness: 0.55 },
    { id: 'round-elbow', fitting: { kind: 'roundElbow', diameter: 450, centerRadius: 450, angle: 90, allowance: 50 }, size: { shape: 'round', diameter: 450 }, thickness: 0.7 },
    { id: 'rect-elbow', fitting: { kind: 'rectElbow', width: 500, height: 200, innerRadius: 200, angle: 90, allowance: 50 }, size: { shape: 'rect', width: 500, height: 200 }, thickness: 0.7 },
    { id: 'round-reducer-larger-end', fitting: { kind: 'roundReducer', diameter: 400, smallDiameter: 300, length: 300, allowance: 50 }, size: { shape: 'round', diameter: 400 }, thickness: 0.7 },
    { id: 'rect-reducer-larger-end', fitting: { kind: 'rectReducer', width: 400, height: 300, smallWidth: 300, smallHeight: 200, length: 300, allowance: 50 }, size: { shape: 'rect', width: 400, height: 300 }, thickness: 0.7 },
    { id: 'rect-to-round-rect-end', fitting: { kind: 'rectToRoundReducer', width: 200, height: 150, smallDiameter: 450, length: 300, allowance: 50 }, size: { shape: 'rect', width: 200, height: 150 }, thickness: 0.55 },
];
