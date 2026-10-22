import { describe, expect, it } from 'vitest';
import { fieldColumns } from '../layout';

const short = (n: number) => Array.from({ length: n }, () => 'Діаметр Д, мм');
const withLong = (n: number) => [...short(n - 1), 'Довжина, мм (необов’язково: 300)'];

describe('fieldColumns', () => {
  it('puts short labels in one row', () => {
    expect(fieldColumns(short(3))).toBe(3);
    expect(fieldColumns(short(5))).toBe(5);
  });

  it('wide labels mean fewer, wider inputs', () => {
    expect(fieldColumns(withLong(5))).toBeLessThan(5);
  });

  it('splits into balanced rows (counts differ by at most one)', () => {
    for (let n = 2; n <= 9; n++) {
      for (const labels of [short(n), withLong(n)]) {
        const cols = fieldColumns(labels);
        const rows = Math.ceil(n / cols);
        const last = n - cols * (rows - 1);
        expect(cols - last).toBeLessThanOrEqual(Math.max(1, rows - 1) + 1);
        expect(last).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('seven fields with one long label split 4 + 3', () => {
    expect(fieldColumns(withLong(7))).toBe(4);
  });
});
