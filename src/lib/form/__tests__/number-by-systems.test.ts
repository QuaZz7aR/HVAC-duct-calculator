import { describe, expect, it } from 'vitest';
import { numberBySystems, systemOf } from '../order';
import { newRow, type FormRow } from '../fields';

const rows = (...positions: (string | undefined)[]): FormRow[] => positions.map((p, i) => ({ ...newRow(i, 'roundStraight'), position: p }));
const pos = (rs: FormRow[]) => rs.map((r) => r.position);

describe('systemOf', () => {
  it('reads the part before the last «-number»', () => {
    expect(systemOf('ПВ1-3')).toBe('ПВ1');
    expect(systemOf('В-2-12')).toBe('В-2');
    expect(systemOf(' П1 - 4 ')).toBe('П1');
    expect(systemOf('П1')).toBeUndefined();
    expect(systemOf('')).toBeUndefined();
    expect(systemOf(undefined)).toBeUndefined();
  });
});

describe('numberBySystems', () => {
  it('renumbers every system in list order, the rest take the typed system', () => {
    expect(pos(numberBySystems(rows('П1-7', 'В1-2', undefined, 'П1-1', 'x'), 'П2', 'all'))).toEqual(['П1-1', 'В1-1', 'П2-1', 'П1-2', 'П2-2']);
  });
  it('without a typed system leaves the rows that have none as they are', () => {
    expect(pos(numberBySystems(rows('П1-3', undefined, 'x'), ' ', 'all'))).toEqual(['П1-1', undefined, 'x']);
  });
  it('fills only the empty positions, after the largest number of the system', () => {
    expect(pos(numberBySystems(rows('П1-4', undefined, ' ', 'В1-9', undefined), 'П1', 'empty'))).toEqual(['П1-4', 'П1-5', 'П1-6', 'В1-9', 'П1-7']);
    expect(pos(numberBySystems(rows(undefined, undefined), 'К1', 'empty'))).toEqual(['К1-1', 'К1-2']);
  });
  it('keeps the order and the other fields', () => {
    const src = rows(undefined, 'a');
    const out = numberBySystems(src, 'П1', 'empty');
    expect(out.map((r) => r.id)).toEqual([0, 1]);
    expect(out[1]).toBe(src[1]);
  });
});
