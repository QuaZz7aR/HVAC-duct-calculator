import { describe, expect, it } from 'vitest';
import { metalArea, wasteFactor } from '../waste-factor';
import { centerlineLength, developedLength, sheetArea } from '../sheet-area';
import { defaultConfig } from '../config';
import type { CalcConfig } from '../config';
import type { Fitting } from '../types';
import { metalAreaCases } from '../__fixtures__/waste-factor.fixtures';

const roundElbow = (diameter: number): Fitting => ({ kind: 'roundElbow', diameter, centerRadius: 250, angle: 90, allowance: 50 });
const rectElbow = (width: number, height: number): Fitting => ({ kind: 'rectElbow', width, height, innerRadius: 125, angle: 90, allowance: 50 });

describe('metalArea', () => {
  it.each(metalAreaCases)('$id', ({ input, factor, metalArea: area }) => {
    expect(wasteFactor(input, defaultConfig)).toBe(factor);
    expect(metalArea(input, defaultConfig)).toBeCloseTo(area, 6);
  });

  it('is sheetArea times the factor and leaves geometry alone', () => {
    const f = roundElbow(250);
    const before = { sheet: sheetArea(f), dev: developedLength(f), center: centerlineLength(f) };
    expect(metalArea(f, defaultConfig)).toBe(sheetArea(f) * wasteFactor(f, defaultConfig));
    expect({ sheet: sheetArea(f), dev: developedLength(f), center: centerlineLength(f) }).toEqual(before);
  });
});

describe('wasteFactor thresholds', () => {
  it('round elbow: below 315 -> 1.15, from 315 -> 1.1', () => {
    expect(wasteFactor(roundElbow(314.9), defaultConfig)).toBe(1.15);
    expect(wasteFactor(roundElbow(315), defaultConfig)).toBe(1.1);
  });

  it('rect elbow: equivalent diameter below 250 -> 1.2, from 250 -> 1.1', () => {
    // 300x200 -> Dh = 240; 375x187.5 -> Dh = 250 exactly
    expect(wasteFactor(rectElbow(300, 200), defaultConfig)).toBe(1.2);
    expect(wasteFactor(rectElbow(375, 187.5), defaultConfig)).toBe(1.1);
  });

  it('rect elbow is keyed by equivalent diameter, not by the larger side', () => {
    // larger side 400 would be past any size threshold, Dh = 2*400*100/500 = 160
    expect(wasteFactor(rectElbow(400, 100), defaultConfig)).toBe(1.2);
  });

  it('every other kind gets the config default', () => {
    const f: Fitting = { kind: 'roundStraight', diameter: 150, length: 1000 };
    const cfg: CalcConfig = { ...defaultConfig, wasteFactor: { ...defaultConfig.wasteFactor, default: 1.5 } };
    expect(wasteFactor(f, defaultConfig)).toBe(defaultConfig.wasteFactor.default);
    expect(wasteFactor(f, cfg)).toBe(1.5);
  });

  it('reads the factors from the config table', () => {
    const cfg: CalcConfig = {
      ...defaultConfig,
      wasteFactor: { ...defaultConfig.wasteFactor, round: [{ fromMm: 0, factor: 2 }] },
    };
    expect(wasteFactor(roundElbow(250), cfg)).toBe(2);
  });
});

describe('wasteFactor errors', () => {
  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])('throws on invalid round diameter %s', (d) => {
    expect(() => wasteFactor(roundElbow(d), defaultConfig)).toThrow();
  });

  it.each([0, -1, Number.NaN])('throws on invalid rect width %s', (w) => {
    expect(() => wasteFactor(rectElbow(w, 150), defaultConfig)).toThrow();
  });

  it('throws when the table has no row for the size', () => {
    const broken: CalcConfig = {
      ...defaultConfig,
      wasteFactor: { ...defaultConfig.wasteFactor, round: [{ fromMm: 400, factor: 1 }] },
    };
    expect(() => wasteFactor(roundElbow(250), broken)).toThrow();
  });
});
