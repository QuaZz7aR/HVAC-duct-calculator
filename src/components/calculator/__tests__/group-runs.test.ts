import { describe, expect, it } from 'vitest';
import { newRow } from '@/lib/form/fields';
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
});
