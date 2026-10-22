import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../../calc/config';
import { calculate } from '../calculate';
import { applyAutoDefaults, isAuto, resetToAuto, setFieldValue, withKind } from '../auto-defaults';
import { initialValues, newRow } from '../fields';

const c = defaultConfig;
const round = () => withKind(newRow(1), 'roundElbow', initialValues('roundElbow'), c);
const rect = () => withKind(newRow(1), 'rectElbow', initialValues('rectElbow'), c);

describe('auto defaults for elbow radius', () => {
  it('leaves the radius empty until the size is valid', () => {
    expect(round().values.centerRadius).toBe('');
    expect(setFieldValue(round(), 'diameter', 'abc', c).values.centerRadius).toBe('');
    expect(setFieldValue(round(), 'diameter', '0', c).values.centerRadius).toBe('');
  });

  it('round: centre radius follows the diameter (R = 1.0 D)', () => {
    const row = setFieldValue(round(), 'diameter', '250', c);
    expect(row.values.centerRadius).toBe('250');
    expect(setFieldValue(row, 'diameter', '400', c).values.centerRadius).toBe('400');
  });

  it('rect: inner radius follows the width (0.5 W), comma accepted, one decimal', () => {
    const row = setFieldValue(rect(), 'width', '350', c);
    expect(row.values.innerRadius).toBe('175');
    expect(setFieldValue(row, 'width', '125,5', c).values.innerRadius).toBe('62.8');
  });

  it('does not follow the height, only the bend-plane width', () => {
    const row = setFieldValue(setFieldValue(rect(), 'width', '350', c), 'height', '150', c);
    expect(row.values.innerRadius).toBe('175');
  });

  it('never overwrites what the user typed', () => {
    let row = setFieldValue(round(), 'diameter', '250', c);
    row = setFieldValue(row, 'centerRadius', '300', c);
    expect(isAuto(row, 'centerRadius')).toBe(false);
    row = setFieldValue(row, 'diameter', '400', c);
    expect(row.values.centerRadius).toBe('300');
  });

  it('clearing the field or resetting returns it to auto', () => {
    let row = setFieldValue(setFieldValue(round(), 'diameter', '250', c), 'centerRadius', '300', c);
    row = setFieldValue(row, 'diameter', '400', c);
    expect(resetToAuto(row, 'centerRadius', c).values.centerRadius).toBe('400');
    expect(setFieldValue(row, 'centerRadius', '', c).values.centerRadius).toBe('400');
  });

  it('a kind change drops the manual marks', () => {
    const row = setFieldValue(setFieldValue(round(), 'diameter', '250', c), 'centerRadius', '300', c);
    expect(withKind(row, 'roundElbow', initialValues('roundElbow'), c).manual).toEqual([]);
  });

  it('other kinds are untouched', () => {
    const row = newRow(1, 'roundStraight');
    expect(applyAutoDefaults(row, c)).toBe(row);
  });

  it('the suggested radius calculates like the fixtures (D250 R250 90)', () => {
    const row = { ...setFieldValue(round(), 'diameter', '250', c), flow: '265' };
    const out = calculate([row], { temperatureC: '22', pressurePa: '101308' }).rows[0];
    expect(out.ok).toBe(true);
    if (out.ok) expect(out.result.metalArea).toBeCloseTo(0.445009697, 6);
  });
});
