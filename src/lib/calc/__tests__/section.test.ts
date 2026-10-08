import { describe, expect, it } from 'vitest';
import { assembleSection } from '../section';
import { defaultConfig } from '../config';
import { AERO_REL_TOLERANCE, VELOCITY_ABS_TOLERANCE, air } from '../__fixtures__/aero.fixtures';
import { sectionCases } from '../__fixtures__/section.fixtures';

const expectClose = (actual: number, expected: number) => {
  if (expected === 0) {
    expect(actual).toBe(0);
    return;
  }
  expect(Math.abs(actual - expected) / expected).toBeLessThan(AERO_REL_TOLERANCE);
};

describe('assembleSection', () => {
  it.each(sectionCases)('$id', ({ input, expected }) => {
    const result = assembleSection(input, air, defaultConfig);
    expect(result.metalArea).toBeCloseTo(expected.metalArea, 6);
    expect(result.centerlineLength).toBeCloseTo(expected.centerlineLength, 6);
    const p = result.pressureDrop;
    const e = expected.pressureDrop;
    expect(Math.abs(p.velocity - e.velocity)).toBeLessThan(VELOCITY_ABS_TOLERANCE);
    expectClose(p.reynolds, e.reynolds);
    expectClose(p.dynamicPressure, e.dynamicPressure);
    expectClose(p.frictionFactor, e.frictionFactor);
    expectClose(p.frictionLoss, e.frictionLoss);
    expectClose(p.localLoss, e.localLoss);
  });
});

describe('assembleSection errors', () => {
  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])('throws on invalid flow %s', (flow) => {
    const input = { fitting: { kind: 'roundStraight', diameter: 150, length: 1000 } as const, flow, localCoefficient: 0.2 };
    expect(() => assembleSection(input, air, defaultConfig)).toThrow();
  });
});
