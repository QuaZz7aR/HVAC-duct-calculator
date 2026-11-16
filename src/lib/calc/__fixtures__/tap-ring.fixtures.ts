import type { Fitting } from '../types';

/**
 * Metal consumption of taps with the ring around the stub (engineer 2026-11-16, item 5; ADR 0043). Ring width 50 mm (config.tap.ringWidthMm).
 * consumption = stub (perimeter x length) + ring; the actual area (sheetArea) stays the stub only, see taps.fixtures.ts.
 *   Квр d200, L 100: pi * 0.2 * 0.1 + pi * (0.15^2 - 0.1^2) = 0.062831853 + 0.039269908 = 0.102101761
 *     (the engineer's order, row 37: 0.1021)
 *   Квр d150, L 100: pi * 0.15 * 0.1 + pi * (0.125^2 - 0.075^2) = 0.047123890 + 0.031415927 = 0.078539816
 *   Пвр 300x100, L 100: 2 * 0.4 * 0.1 + (0.4 * 0.2 - 0.3 * 0.1) = 0.08 + 0.05 = 0.13
 *   Пвр 200x150, L 120: 2 * 0.35 * 0.12 + (0.3 * 0.25 - 0.2 * 0.15) = 0.084 + 0.045 = 0.129
 */
export interface TapRingCase {
  id: string;
  input: Fitting;
  ring: number; // m2, tapRingArea
  consumption: number; // m2, consumptionArea (no waste factor)
  basis: 'geometry';
}

export const tapRingCases: TapRingCase[] = [
  { id: 'round-tap-d200-l100', input: { kind: 'roundTap', diameter: 200, length: 100 }, ring: 0.039269908, consumption: 0.102101761, basis: 'geometry' },
  { id: 'round-tap-d150-l100', input: { kind: 'roundTap', diameter: 150, length: 100 }, ring: 0.031415927, consumption: 0.078539816, basis: 'geometry' },
  { id: 'rect-tap-300x100-l100', input: { kind: 'rectTap', width: 300, height: 100, length: 100 }, ring: 0.05, consumption: 0.13, basis: 'geometry' },
  { id: 'rect-tap-200x150-l120', input: { kind: 'rectTap', width: 200, height: 150, length: 120 }, ring: 0.045, consumption: 0.129, basis: 'geometry' },
];
