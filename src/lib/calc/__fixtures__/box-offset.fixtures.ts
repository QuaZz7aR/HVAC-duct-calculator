/**
 * Reference values for the BETA kinds of ADR 0113: adapter / box (rectBox) and offsets («утка», roundOffset / rectOffset).
 * SOURCE OF TRUTH - do not edit expected values to make a test pass.
 *
 * - Sizes in mm, `area` in m2, pure geometry: no cutting-waste factor, Math.PI; `centerline` in m.
 * - Box: 2(a + b) L + (ends + partitions) a b; with ends = 2, partitions = 0 this is the engineer's template «Адаптор» 2(AB + AL + BL).
 * - Rect offset: the two walls in the offset plane are parallelograms a x L, the other two run along the slant sqrt(L^2 + H^2);
 *   allowance strips 2(a + b) x count x p. Round offset: pi d (sqrt(L^2 + H^2) + count x p).
 * - `specM2` is the figure of the engineer's real specification (Квартира, Київ, 2021, Лист1), rounded by him to 0.01 m2;
 *   kept for comparison only, tests assert `area`.
 */
import type {Fitting} from '../types';

export interface BoxOffsetCase {
    id: string;
    input: Fitting;
    area: number;
    centerline: number;
    thicknessMm: number; // default DBN table, rect by the larger side
    specM2?: number;
}

export const boxOffsetCases: BoxOffsetCase[] = [
    {
        id: 'rect-offset-200x400-l350-h120',
        input: {kind: 'rectOffset', width: 200, height: 400, length: 350, offset: 120, allowance: 50},
        area: 0.556, // 2*0.2*0.35 + 2*0.4*sqrt(0.35^2 + 0.12^2) + 2*(0.2 + 0.4)*2*0.05 = 0.14 + 0.296 + 0.12
        centerline: 0.37, // sqrt(0.35^2 + 0.12^2)
        thicknessMm: 0.7,
        specM2: 0.56, // «Утка 200х400об, подъем на 120мм», L 350
    },
    {
        id: 'rect-offset-150x400-l330-h158',
        input: {kind: 'rectOffset', width: 150, height: 400, length: 330, offset: 158, allowance: 50},
        area: 0.501699436, // 2*0.15*0.33 + 2*0.4*0.365874295 + 2*(0.15 + 0.4)*0.1
        centerline: 0.365874295,
        thicknessMm: 0.7,
        specM2: 0.5,
    },
    {
        id: 'rect-offset-100x300-l150-h55',
        input: {kind: 'rectOffset', width: 100, height: 300, length: 150, offset: 55, allowance: 50},
        area: 0.205859272, // 2*0.1*0.15 + 2*0.3*0.159765453 + 2*(0.1 + 0.3)*0.1
        centerline: 0.159765453,
        thicknessMm: 0.7,
        specM2: 0.21,
    },
    {
        id: 'round-offset-d200-l500-h200',
        input: {kind: 'roundOffset', diameter: 200, length: 500, offset: 200, allowance: 50},
        area: 0.401191737, // pi*0.2*(sqrt(0.5^2 + 0.2^2) + 0.1)
        centerline: 0.538516481,
        thicknessMm: 0.5,
    },
    {
        id: 'box-600x300-l500-closed',
        input: {kind: 'rectBox', width: 600, height: 300, length: 500, ends: 2, partitions: 0},
        area: 1.26, // 2*(0.6*0.3 + 0.6*0.5 + 0.3*0.5)
        centerline: 0.5,
        thicknessMm: 0.7,
    },
    {
        id: 'box-350x500-l500-one-end',
        input: {kind: 'rectBox', width: 350, height: 500, length: 500, ends: 1, partitions: 0},
        area: 1.025, // 2*(0.35 + 0.5)*0.5 + 0.35*0.5
        centerline: 0.5,
        thicknessMm: 0.7,
        specM2: 1.25, // «Короб 350х500h» with taps 400х150h and 350х250h: + 0.11 + 0.12 as separate Пвр rows = 1.255
    },
    {
        id: 'box-slot-95x220-l3010-6-partitions',
        input: {kind: 'rectBox', width: 95, height: 220, length: 3010, ends: 2, partitions: 6},
        area: 2.0635, // 2*(0.095 + 0.22)*3.01 + 8*0.095*0.22
        centerline: 3.01,
        thicknessMm: 0.5,
        specM2: 1.6, // slot-diffuser adapter: the engineer leaves one side open (not modelled yet)
    },
];
