import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../config';
import type { Fitting } from '../types';
import { fittingWarnings } from '../warnings';

const codes = (f: Fitting) => fittingWarnings(f, defaultConfig).map((w) => w.code);
const rect = (width: number, height: number): Fitting => ({ kind: 'rectStraight', width, height, length: 1000 });

describe('fittingWarnings: aspect ratio', () => {
  it('is silent below the warning threshold', () => {
    expect(codes(rect(500, 200))).toEqual([]); // 2.5
    expect(codes(rect(200, 500))).toEqual([]);
  });
  it('warns from 3 (inclusive), in either orientation', () => {
    expect(codes(rect(600, 200))).toEqual(['aspect.high']);
    expect(codes(rect(200, 600))).toEqual(['aspect.high']);
  });
  it('warns strongly only above 6.3, and then instead of the plain warning', () => {
    expect(codes(rect(630, 100))).toEqual(['aspect.high']); // exactly 6.3 is allowed
    const w = fittingWarnings(rect(700, 100), defaultConfig);
    expect(w).toEqual([{ code: 'aspect.excessive', level: 'strong', value: 7, limit: 6.3 }]);
  });
  it('checks both ends of a rect reducer and the rect end of rect-to-round', () => {
    const base = { kind: 'rectReducer', width: 300, height: 200, smallWidth: 600, smallHeight: 100, length: 300, allowance: 50 } as const;
    expect(fittingWarnings(base, defaultConfig)[0]).toMatchObject({ code: 'aspect.high', value: 6 });
    const r2r: Fitting = { kind: 'rectToRoundReducer', width: 800, height: 100, smallDiameter: 100, length: 300, allowance: 50 };
    expect(codes(r2r)).toEqual(['aspect.excessive']);
  });
  it('does not apply to round fittings', () => {
    expect(codes({ kind: 'roundStraight', diameter: 200, length: 1000 })).toEqual([]);
  });
});

describe('fittingWarnings: size over 2000 mm', () => {
  it('warns above the limit, not at it', () => {
    expect(codes(rect(2000, 1000))).toEqual([]);
    expect(codes(rect(2100, 1000))).toEqual(['size.overLimit']);
    expect(fittingWarnings(rect(2100, 1000), defaultConfig)[0]).toMatchObject({ value: 2100, limit: 2000 });
  });
  it('also applies to a round diameter and to the small end of a reducer', () => {
    expect(codes({ kind: 'roundStraight', diameter: 2200, length: 1000 })).toEqual(['size.overLimit']);
    expect(codes({ kind: 'roundReducer', diameter: 500, smallDiameter: 300, length: 300, allowance: 50 })).toEqual([]);
  });
  it('is reported together with an aspect warning', () => {
    expect(codes(rect(2100, 700))).toEqual(['aspect.high', 'size.overLimit']);
  });
});

describe('fittingWarnings: elbow inner radius', () => {
  const rectElbow = (innerRadius: number): Fitting => ({ kind: 'rectElbow', width: 300, height: 200, innerRadius, angle: 90, allowance: 50 });
  it('rect: warns when the inner radius exceeds 2 x width', () => {
    expect(codes(rectElbow(600))).toEqual([]);
    const w = fittingWarnings(rectElbow(601), defaultConfig);
    expect(w).toEqual([{ code: 'elbow.radiusLarge', level: 'warning', value: 601, limit: 600 }]);
  });
  it('round: inner radius is center radius minus half the diameter', () => {
    const el = (centerRadius: number): Fitting => ({ kind: 'roundElbow', diameter: 200, centerRadius, angle: 90, allowance: 50 });
    expect(codes(el(500))).toEqual([]); // inner 400 = 2 x 200
    expect(codes(el(501))).toEqual(['elbow.radiusLarge']);
  });
  it('typical radii do not warn', () => {
    expect(codes(rectElbow(100))).toEqual([]);
  });
});

describe('fittingWarnings: config', () => {
  it('reads the thresholds from config', () => {
    const cfg = { ...defaultConfig, warnings: { ...defaultConfig.warnings, aspectRatioWarn: 2 } };
    expect(fittingWarnings(rect(500, 200), cfg).map((w) => w.code)).toEqual(['aspect.high']);
  });
});
