import { describe, expect, it } from 'vitest';
import { airAtConditions } from '../../calc/air';
import { defaultConfig } from '../../calc/config';
import { assembleSection } from '../../calc/section';
import { uk } from '../../i18n/uk';
import { calculate } from '../calculate';
import { newRow, type FormRow } from '../fields';
import { warningMessage } from '../messages';

const air = { temperatureC: '22', pressurePa: '101308' };
const rectRow = (width: string, height: string, over: Partial<FormRow> = {}): FormRow => ({
  ...newRow(1, 'rectStraight'),
  values: { width, height, length: '1000' },
  flow: '500',
  ...over,
});

describe('calculate: warnings', () => {
  it('attaches warnings to a valid row and still calculates it', () => {
    const out = calculate([rectRow('700', '100')], air).rows[0];
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.result.warnings.map((w) => w.code)).toEqual(['aspect.excessive']);
    expect(out.result.metalArea).toBeGreaterThan(0);
  });
  it('does not change the sizes: area equals the unwarned geometry', () => {
    const out = calculate([rectRow('700', '100')], air).rows[0];
    if (!out.ok) throw new Error('expected ok');
    expect(out.result.fitting).toMatchObject({ width: 700, height: 100 });
    // a warned row has the same numbers as the same geometry through the plain core
    const core = assembleSection({ fitting: out.result.fitting, flow: 500, localCoefficient: 0 }, airAtConditions(22, 101308, defaultConfig), defaultConfig);
    expect(out.result.metalArea).toBe(core.metalArea);
    expect(out.result.pressureDrop.frictionLoss).toBe(core.pressureDrop.frictionLoss);
  });
  it('is empty for a normal fitting', () => {
    const out = calculate([rectRow('300', '200')], air).rows[0];
    expect(out.ok && out.result.warnings).toEqual([]);
  });
});

describe('warningMessage', () => {
  it('has Ukrainian text for every code, with the numbers filled in', () => {
    const text = warningMessage({ code: 'aspect.excessive', level: 'strong', value: 7, limit: 6.3 }, uk);
    expect(text).toContain('7');
    expect(text).toContain('6,3');
    for (const code of ['aspect.high', 'size.overLimit', 'elbow.radiusLarge'] as const) {
      expect(warningMessage({ code, level: 'warning', value: 1, limit: 2 }, uk).length).toBeGreaterThan(10);
    }
  });
});

describe('warningMessage rounding', () => {
  it('never shows a value equal to its limit', () => {
    const text = warningMessage({ code: 'aspect.excessive', level: 'strong', value: 6.304, limit: 6.3 }, uk);
    expect(text).toContain('6,31 перевищує 6,3');
  });
});
