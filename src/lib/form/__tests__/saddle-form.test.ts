import { describe, expect, it } from 'vitest';
import { calculate } from '../calculate';
import { newRow, type FormRow } from '../fields';
import { withKind } from '../auto-defaults';
import { defaultConfig } from '../../calc/config';
import { parseProject, serializeProject } from '../project-store';

const air = { temperatureC: '20', pressurePa: '101325' };
const area = (row: FormRow) => {
  const r = calculate([row], air).rows[0];
  if (!r.ok) throw new Error(JSON.stringify(r.issues));
  return r.result.metalArea;
};

describe('saddle in the form (ADR 0118)', () => {
  const tap: FormRow = { ...newRow(1, 'roundTap'), values: { diameter: '150', length: '100' }, flow: '1' };
  const tee: FormRow = { ...newRow(2, 'roundTee'), values: { diameter: '355', branchDiameter: '200', allowance: '50' }, flow: '1' };

  it('a tap takes the main diameter, empty = a flat wall', () => {
    expect(area({ ...tap, saddle: '200' })).toBeGreaterThan(area(tap));
    expect(area({ ...tap, saddle: '' })).toBeCloseTo(area(tap), 12);
  });

  it('a round-main tee takes «1» = on, anything else = off', () => {
    expect(area({ ...tee, saddle: '1' })).toBeGreaterThan(area(tee));
    expect(area({ ...tee, saddle: '' })).toBeCloseTo(area(tee), 12);
  });

  it('the choice is saved with the project and dropped on a kind change', () => {
    const back = parseProject(serializeProject({ rows: [{ ...tee, saddle: '1' }] } as never));
    expect(back?.rows?.[0]?.saddle).toBe('1');
    expect(withKind({ ...tee, saddle: '1' }, 'roundTap', {}, defaultConfig).saddle).toBeUndefined();
  });

  it('the form no longer counts box partitions', () => {
    const box: FormRow = { ...newRow(3, 'rectBox'), values: { width: '95', height: '220', length: '3010', ends: '2', openFaces: '1', partitions: '6' }, flow: '1' };
    expect(area(box)).toBeCloseTo((2 * (0.095 + 0.22) - 0.095) * 3.01 + 2 * 0.095 * 0.22, 9);
  });
});
