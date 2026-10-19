import { describe, expect, it } from 'vitest';
import { defaultConfig, dbnThickness, engineerThickness } from '../../calc/config';
import { metalArea, wasteFactor } from '../../calc/waste-factor';
import { calculate } from '../calculate';
import { newRow, type FormRow } from '../fields';
import { buildConfig, defaultSettings, sheetKey, type SettingsText } from '../settings';

const air = { temperatureC: '22', pressurePa: '101308' };
const straight = (over: Partial<FormRow> = {}): FormRow => ({
  ...newRow(1),
  values: { diameter: '150', length: '1000' },
  flow: '265',
  zeta: '0.218',
  ...over,
});
const text = (over: Partial<SettingsText> = {}): SettingsText => ({ ...defaultSettings(), ...over });

describe('buildConfig', () => {
  it('the default settings reproduce the default config values', () => {
    const { config, issues } = buildConfig(defaultSettings());
    expect(issues).toEqual([]);
    expect(config.thickness).toBe(dbnThickness);
    expect(config.wasteFactor.default).toBe(1);
    expect(config.order.marginPercent).toBe(20);
    expect(config.order.sheet).toEqual({ widthMm: 1250, heightMm: 2500 });
  });

  it('selects the engineer thickness table', () => {
    expect(buildConfig(text({ thicknessTable: 'engineer' })).config.thickness).toBe(engineerThickness);
  });

  it('accepts a decimal comma and treats empty as 0', () => {
    const { config } = buildConfig(text({ seamPercent: '2,5', marginPercent: '' }));
    expect(config.wasteFactor.default).toBeCloseTo(1.025, 12);
    expect(config.order.marginPercent).toBe(0);
  });

  it('reports a bad percent and keeps the base value', () => {
    const { config, issues } = buildConfig(text({ seamPercent: '-1', marginPercent: 'abc' }));
    expect(issues).toEqual([
      { code: 'coefficient.negative', path: ['seamPercent'] },
      { code: 'size.notFinite', path: ['marginPercent'] },
    ]);
    expect(config.wasteFactor.default).toBe(1);
    expect(config.order.marginPercent).toBe(20);
  });

  it('an unknown sheet key falls back to the default sheet', () => {
    expect(buildConfig(text({ sheet: '1x1' })).config.order.sheet).toEqual(defaultConfig.order.sheet);
    expect(buildConfig(text({ sheet: sheetKey({ widthMm: 1500, heightMm: 3000 }) })).config.order.sheet).toEqual({ widthMm: 1500, heightMm: 3000 });
  });
});

describe('seam allowance', () => {
  const { config } = buildConfig(text({ seamPercent: '10' }));
  it('scales every kind except elbows', () => {
    const duct = { kind: 'roundStraight', diameter: 150, length: 1000 } as const;
    expect(metalArea(duct, config)).toBeCloseTo(1.1 * metalArea(duct, defaultConfig), 12);
    const elbow = { kind: 'roundElbow', diameter: 150, centerRadius: 150, angle: 90, allowance: 50 } as const;
    expect(wasteFactor(elbow, config)).toBe(wasteFactor(elbow, defaultConfig));
  });
  it('is off by default', () => {
    expect(defaultConfig.wasteFactor.default).toBe(1);
  });
});

describe('calculate with the order settings', () => {
  it('the order total is the computed total plus the margin, and the computed total is unchanged', () => {
    const base = calculate([straight({ quantity: '4' })], air);
    const { config } = buildConfig(text({ marginPercent: '25' }));
    const calc = calculate([straight({ quantity: '4' })], air, config);
    expect(calc.totalMetalArea).toBeCloseTo(base.totalMetalArea, 12);
    expect(calc.totalMetalAreaToOrder).toBeCloseTo(1.25 * base.totalMetalArea, 12);
  });

  it('the sheet list carries order area and whole sheets per thickness', () => {
    const calc = calculate([straight({ quantity: '10' })], air); // 10 x 0.471239 = 4.71239 m2 -> x1.2 = 5.6549 -> 2 sheets of 3.125
    const [line] = calc.sheetList;
    expect(line.thicknessMm).toBe(0.5);
    expect(line.area).toBeCloseTo(4.71238898, 6);
    expect(line.orderArea).toBeCloseTo(5.654866776, 6);
    expect(line.sheets).toBe(2);
  });

  it('a smaller sheet needs more sheets', () => {
    const { config } = buildConfig(text({ sheet: sheetKey({ widthMm: 1000, heightMm: 2000 }) }));
    expect(calculate([straight({ quantity: '10' })], air, config).sheetList[0].sheets).toBe(3); // 5.6549 / 2 = 2.83
  });
});
