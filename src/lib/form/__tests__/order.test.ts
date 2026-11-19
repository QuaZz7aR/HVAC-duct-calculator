import { describe, expect, it } from 'vitest';
import { newRow } from '../fields';
import { moveBy, moveOnto, moveTo, moveBlock, positionLabel, positionSpan } from '../order';

const rows = [1, 2, 3, 4].map((id) => newRow(id));
const ids = (rs: typeof rows) => rs.map((r) => r.id);

describe('row order', () => {
  it('moves a row to an index', () => {
    expect(ids(moveTo(rows, 1, 2))).toEqual([2, 3, 1, 4]);
    expect(ids(moveTo(rows, 4, 0))).toEqual([4, 1, 2, 3]);
    expect(ids(moveTo(rows, 2, 99))).toEqual([1, 3, 4, 2]);
  });
  it('steps up and down and stops at the edges', () => {
    expect(ids(moveBy(rows, 3, -1))).toEqual([1, 3, 2, 4]);
    expect(ids(moveBy(rows, 3, 1))).toEqual([1, 2, 4, 3]);
    expect(moveBy(rows, 1, -1)).toBe(rows);
    expect(moveBy(rows, 4, 1)).toBe(rows);
  });
  it('drops onto another row in both directions', () => {
    expect(ids(moveOnto(rows, 1, 3))).toEqual([2, 3, 1, 4]);
    expect(ids(moveOnto(rows, 4, 2))).toEqual([1, 4, 2, 3]);
  });
  it('leaves the list for an unknown id', () => {
    expect(moveTo(rows, 9, 0)).toBe(rows);
    expect(moveOnto(rows, 9, 1)).toBe(rows);
  });
});

describe('positionLabel', () => {
  it('is the list number unless the user typed one', () => {
    expect(positionLabel(newRow(7), 2)).toBe('3');
    expect(positionLabel({ ...newRow(7), position: ' П1 ' }, 2)).toBe('П1');
    expect(positionLabel({ ...newRow(7), position: '  ' }, 0)).toBe('1');
  });
});

describe('positionSpan', () => {
  it('spans consecutive list numbers and lists the rest', () => {
    expect(positionSpan(['1', '2', '3'])).toBe('1–3');
    expect(positionSpan(['П1', 'П2'])).toBe('П1, П2');
    expect(positionSpan(['4', '7'])).toBe('4, 7');
    expect(positionSpan(['5'])).toBe('5');
  });
});

describe('moveBlock', () => {
  const six = [1, 2, 3, 4, 5, 6].map((id) => newRow(id));
  it('moves a section down and up as a whole', () => {
    expect(ids(moveBlock(six, [2, 3], 5))).toEqual([1, 4, 5, 2, 3, 6]);
    expect(ids(moveBlock(six, [4, 5], 1))).toEqual([4, 5, 1, 2, 3, 6]);
  });
  it('agrees with moveOnto for one row and ignores a target inside the block', () => {
    expect(ids(moveBlock(six, [1], 3))).toEqual(ids(moveOnto(six, 1, 3)));
    expect(moveBlock(six, [2, 3], 3)).toBe(six);
  });
});
