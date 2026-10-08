import { describe, expect, it } from 'vitest';
import { airAtConditions } from '../air';
import { defaultConfig } from '../config';
import type { CalcConfig } from '../config';
import { airCases } from '../__fixtures__/air.fixtures';

const REL_TOLERANCE = 1e-6;
const relErr = (actual: number, expected: number): number => Math.abs(actual - expected) / Math.abs(expected);

describe('airAtConditions', () => {
  it.each(airCases)('$id', ({ temperatureC, pressurePa, density, kinematicViscosity }) => {
    const air = airAtConditions(temperatureC, pressurePa, defaultConfig);
    expect(relErr(air.density, density)).toBeLessThan(REL_TOLERANCE);
    expect(relErr(air.kinematicViscosity, kinematicViscosity)).toBeLessThan(REL_TOLERANCE);
  });

  it('config defaults give the 22 C case', () => {
    const { airTemperatureC, airPressurePa } = defaultConfig.air;
    const air = airAtConditions(airTemperatureC, airPressurePa, defaultConfig);
    expect(relErr(air.density, airCases[0].density)).toBeLessThan(REL_TOLERANCE);
  });

  it('reads the constants from the config', () => {
    const cfg: CalcConfig = { ...defaultConfig, air: { ...defaultConfig.air, gasConstantJPerKgK: 574 } };
    const base = airAtConditions(22, 101308, defaultConfig);
    expect(airAtConditions(22, 101308, cfg).density).toBeCloseTo(base.density / 2, 10);
  });
});

describe('airAtConditions errors', () => {
  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])('throws on non-finite temperature %s', (t) => {
    expect(() => airAtConditions(t, 101325, defaultConfig)).toThrow();
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY])('throws on non-finite pressure %s', (p) => {
    expect(() => airAtConditions(20, p, defaultConfig)).toThrow();
  });

  it.each([0, -1, -101325])('throws on pressure <= 0: %s', (p) => {
    expect(() => airAtConditions(20, p, defaultConfig)).toThrow();
  });

  it.each([-273, -300])('throws when T + T0 <= 0: %s C', (t) => {
    expect(() => airAtConditions(t, 101325, defaultConfig)).toThrow();
  });
});
