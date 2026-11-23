import { describe, expect, it } from 'vitest';
import { newRow } from '@/lib/form/fields';
import { moveBlock, moveBy } from '@/lib/form/order';
import { groupRuns } from '../FittingList';

describe('groupRuns', () => {
  it('groups only neighbouring rows of one kind and keeps list numbers', () => {
    const rows = [newRow(1, 'roundElbow'), newRow(2, 'roundElbow'), newRow(3, 'roundStraight'), newRow(4, 'roundElbow')];
    const runs = groupRuns(rows);
    expect(runs.map((r) => [r.kind, r.items.map((i) => i.index)])).toEqual([
      ['roundElbow', [0, 1]],
      ['roundStraight', [2]],
      ['roundElbow', [3]],
    ]);
  });

  const shape = (rows: ReturnType<typeof newRow>[]) => groupRuns(rows).map((r) => r.items.map((i) => i.row.id));

  it('merges and splits sections as cards move (ADR 0049)', () => {
    const rows = [newRow(1, 'roundElbow'), newRow(2, 'roundElbow'), newRow(3, 'roundStraight'), newRow(4, 'roundElbow')];
    const merged = moveBy(rows, 4, -1); // the lone elbow joins the section
    expect(shape(merged)).toEqual([[1, 2, 4], [3]]);
    const split = moveBy(merged, 3, -1); // the straight steps into the section and splits it
    expect(shape(split)).toEqual([[1, 2], [3], [4]]);
    const out = moveBy(rows, 2, 1); // the last elbow leaves its section
    expect(shape(out)).toEqual([[1], [3], [2, 4]]);
  });

  it('a whole section moved next to a run of its kind merges with it', () => {
    const rows = [newRow(1, 'roundElbow'), newRow(2, 'roundElbow'), newRow(3, 'roundStraight'), newRow(4, 'roundElbow')];
    expect(shape(moveBlock(rows, [1, 2], 3))).toEqual([[3], [1, 2, 4]]);
  });
});
