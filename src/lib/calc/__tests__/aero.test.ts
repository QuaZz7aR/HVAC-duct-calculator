import { describe, expect, it } from 'vitest';
import { pressureDrop } from '../aero';
import {
  AERO_REL_TOLERANCE,
  VELOCITY_ABS_TOLERANCE,
  aeroCases,
  air,
} from '../__fixtures__/aero.fixtures';

const expectClose = (actual: number, expected: number) =>
  expect(Math.abs(actual - expected) / expected).toBeLessThan(AERO_REL_TOLERANCE);

describe('pressureDrop', () => {
  it.each(aeroCases)('$id ($excelCode)', ({ section, expected }) => {
    const result = pressureDrop(section, air);
    expect(Math.abs(result.velocity - expected.velocity)).toBeLessThan(VELOCITY_ABS_TOLERANCE);
    expectClose(result.reynolds, expected.reynolds);
    expectClose(result.dynamicPressure, expected.dynamicPressure);
    expectClose(result.frictionFactor, expected.frictionFactor);
    expectClose(result.frictionLoss, expected.frictionLoss);
    expectClose(result.localLoss, expected.localLoss);
  });
});
