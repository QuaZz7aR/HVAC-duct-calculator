import type { CalcConfig } from '../calc/config';
import { mToMm } from '../calc/units';
import { applyAutoDefaults, setFieldValue } from '../form/auto-defaults';
import { defaultValues } from '../form/defaults';
import { initialValues, kindFields, newRow, type FieldKey, type FittingKind, type FormRow, type SizeConflict } from '../form/fields';
import { parseName, recognizeKind, type NameSize } from './recognize';
import { rowLines, type Cell, type Table } from './xlsx';

/**
 * Columns of a spec table and how its rows become form rows (ADR 0061). The size columns follow the engineer's Excel:
 * A = width or diameter, B = height, a / b = the small end or the branch, l = allowance, R = radius, α = angle, L = length.
 */
export const columnKeys = ['system', 'position', 'name', 'code', 'A', 'B', 'a', 'b', 'l', 'R', 'angle', 'L', 'quantity'] as const;
export type ColumnKey = (typeof columnKeys)[number];
export type LengthUnit = 'm' | 'mm';

export interface Mapping {
  /** Index of the header row; data starts below it. -1 = no header, data from the first row. */
  header: number;
  columns: Partial<Record<ColumnKey, number>>;
  lengthUnit: LengthUnit;
}

// H: the offset of an утка, read from the name only (ADR 0113)
type SizeSlot = 'A' | 'B' | 'a' | 'b' | 'l' | 'R' | 'angle' | 'L' | 'H' | 'P' | 'O';
// P: the partitions of a box, read from the name only (ADR 0115)

/** Which form field each size column feeds, per kind. A column a kind has no field for is ignored (elbow «Довжина» is a computed value in the Excel). */
const slots: Record<FittingKind, Partial<Record<SizeSlot, FieldKey>>> = {
  roundStraight: { A: 'diameter', L: 'length' },
  rectStraight: { A: 'width', B: 'height', L: 'length' },
  roundElbow: { A: 'diameter', l: 'allowance', R: 'centerRadius', angle: 'angle' },
  rectElbow: { A: 'width', B: 'height', l: 'allowance', R: 'innerRadius', angle: 'angle' },
  roundReducer: { A: 'diameter', a: 'smallDiameter', l: 'allowance', L: 'length' },
  rectReducer: { A: 'width', B: 'height', a: 'smallWidth', b: 'smallHeight', l: 'allowance', L: 'length' },
  rectToRoundReducer: { A: 'width', B: 'height', a: 'smallDiameter', l: 'allowance', L: 'length' },
  roundCap: { A: 'diameter', L: 'length' },
  rectCap: { A: 'width', B: 'height', L: 'length' },
  // the Excel's l of a tap is the width of the ring (config.tap), its L the stub length
  roundTap: { A: 'diameter', L: 'length' },
  rectTap: { A: 'width', B: 'height', L: 'length' },
  roundTee: { A: 'diameter', a: 'branchDiameter', l: 'allowance' },
  roundTeeRectBranch: { A: 'diameter', a: 'branchWidth', b: 'branchHeight', l: 'allowance' },
  rectTee: { A: 'width', B: 'height', a: 'branchWidth', b: 'branchHeight', l: 'allowance' },
  rectTeeRoundBranch: { A: 'width', B: 'height', a: 'branchDiameter', l: 'allowance' },
  roundCross: { A: 'diameter', a: 'branchDiameter', l: 'allowance' },
  roundCrossRectBranches: { A: 'diameter', a: 'branchWidth', b: 'branchHeight', l: 'allowance' },
  rectCross: { A: 'width', B: 'height', a: 'branchWidth', b: 'branchHeight', l: 'allowance' },
  rectCrossRoundBranches: { A: 'width', B: 'height', a: 'branchDiameter', l: 'allowance' },
  // BETA (ADR 0113): the template's «Адаптор» row has A, B and L; offsets take the offset from the name only
  // partitions are read from the name but the form no longer counts them (ADR 0118)
  rectBox: { A: 'width', B: 'height', L: 'length', P: 'partitions', O: 'openFaces' },
  roundOffset: { A: 'diameter', l: 'allowance', L: 'length', H: 'offset' },
  rectOffset: { A: 'width', B: 'height', l: 'allowance', L: 'length', H: 'offset' },
};

const text = (c: Cell | undefined): string => (c === null || c === undefined ? '' : String(c).trim());

/** An Excel error value as the file shows it: #VALUE!, #DIV/0!, #N/A, #REF!, #NAME?, #NUM!, #NULL!, or ### (too narrow). */
const excelError = (c: Cell | undefined) => /^#(VALUE!|DIV\/0!|N\/A|REF!|NAME\?|NUM!|NULL!|#+)$/i.test(text(c).replace(/\s+/g, ''));

/** A number from a cell («0,55», 150, «-» = none). */
export function cellNumber(c: Cell | undefined): number | undefined {
  if (typeof c === 'number') return Number.isFinite(c) ? c : undefined;
  const t = text(c).replace(/\s/g, '').replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(t)) return undefined;
  return Number(t);
}

const systemRe = /^[A-ZА-ЯІЇЄҐ]{1,4}\d+[A-ZА-ЯІЇЄҐ]?$/i;
const isSystem = (c: Cell | undefined) => systemRe.test(text(c)) && !/^\d/.test(text(c));

// header texts, Ukrainian, Russian and English; the small-end columns are tested before the main ones
const headerRules: [ColumnKey, RegExp][] = [
  ['a', /(менш|меньш|small).*(шир|діам|диам|width|diam)/i],
  ['b', /(менш|меньш|small).*(висот|высот|height)/i],
  ['quantity', /кільк|кол-?во|количеств|qty|quantity|^шт/i],
  ['l', /припуск|allowance/i],
  ['R', /радіус|радиус|radius/i],
  ['angle', /кут|угол|angle|α/i],
  ['L', /довжин|длин|length/i],
  ['A', /ширин|діаметр|диаметр|width|diameter/i],
  ['B', /висот|высот|height/i],
  ['system', /систем|system/i],
  ['position', /^№|^поз|^n[o°]?\.?$|position/i],
  ['code', /^(тип|код|позначен|обознач|code|type)/i],
  ['name', /найменув|наимен|назв|примітк|примечан|опис|описан|name|description/i],
];

// one-letter headers as in the Excel: the case decides, A / B the main size, a / b the small end or branch
const letterKeys: Record<string, ColumnKey> = { A: 'A', B: 'B', a: 'a', b: 'b', l: 'l', R: 'R', 'α': 'angle', L: 'L', D: 'A', d: 'a' };

function headerKey(c: Cell | undefined): ColumnKey | undefined {
  const t = text(c);
  if (!t) return undefined;
  if (letterKeys[t]) return letterKeys[t];
  // a header wrapped in a narrow PDF cell may come with a space inside a word («Шири на»): try it without the spaces too
  const squeezed = t.replace(/\s+/g, '');
  return headerRules.find(([, re]) => re.test(t))?.[0] ?? headerRules.find(([, re]) => re.test(squeezed))?.[0];
}

/** The row that names most columns among the first rows; -1 when none names two. */
export function findHeader(table: Table): number {
  let best = -1;
  let score = 1;
  for (let r = 0; r < Math.min(table.length, 30); r++) {
    const n = new Set(table[r].map(headerKey).filter(Boolean)).size;
    if (n > score) { best = r; score = n; }
  }
  return best;
}

/** True when the cell is a fitting code (КВ, ПО, CE...). */
const isCode = (c: Cell | undefined) => {
  const t = text(c);
  return t.length > 0 && t.length <= 6 && !/\d/.test(t) && recognizeKind(t, undefined, [{ d: 1 }]) !== undefined;
};

/** A first guess of the mapping: header texts first, then the content of the unnamed columns (codes, systems, numbers, names). */
export function guessMapping(table: Table): Mapping {
  const header = findHeader(table);
  const columns: Mapping['columns'] = {};
  const width = Math.max(0, ...table.map((r) => r.length));
  const taken = new Set<number>();
  if (header >= 0) {
    table[header].forEach((c, i) => {
      const k = headerKey(c);
      if (k && columns[k] === undefined) { columns[k] = i; taken.add(i); }
    });
  }
  const data = table.slice(header + 1, header + 201);
  const share = (col: number, test: (c: Cell | undefined) => boolean) => {
    // an Excel error («#VALUE!», also wrapped as «#VALU E!» in a PDF cell) says nothing about the column
    const filled = data.filter((r) => text(r[col]) !== '' && !excelError(r[col]));
    return filled.length ? filled.filter((r) => test(r[col])).length / filled.length : 0;
  };
  const free = () => [...Array(width).keys()].filter((i) => !taken.has(i));
  alignSizes(columns, taken, (col) => share(col, (c) => text(c) === '-' || cellNumber(c) !== undefined));
  // the code, system, number and name columns stand left of the sizes
  const limit = columns.A ?? width;
  const freeLeft = () => free().filter((i) => i < limit);
  const pick = (key: ColumnKey, test: (c: Cell | undefined) => boolean, min: number) => {
    if (columns[key] !== undefined) return;
    const best = freeLeft().map((i) => [i, share(i, test)] as const).filter(([, s]) => s >= min).sort((x, y) => y[1] - x[1])[0];
    if (best) { columns[key] = best[0]; taken.add(best[0]); }
  };
  pick('code', isCode, 0.6);
  pick('system', isSystem, 0.6);
  pick('position', (c) => Number.isInteger(cellNumber(c)), 0.9);
  // the name: the free text column with most filled cells
  if (columns.name === undefined) {
    const best = freeLeft()
      .map((i) => [i, data.filter((r) => text(r[i]) !== '' && cellNumber(r[i]) === undefined).length] as const)
      .filter(([, n]) => n > 0)
      .sort((x, y) => y[1] - x[1])[0];
    if (best) { columns.name = best[0]; taken.add(best[0]); }
  }
  return { header, columns, lengthUnit: guessUnit(table, header, columns.L) };
}

const numericKeys: ColumnKey[] = ['A', 'B', 'a', 'b', 'l', 'R', 'angle', 'L', 'quantity'];

/**
 * A header row may be one cell off its data (a real file: the code column has no header, so «Ширина» stands over the codes).
 * The size columns move together by the offset (-1, 0, +1) under which most of them hold numbers; a tie goes to the offset with
 * numbers under «A», else keeps them.
 */
function alignSizes(columns: Mapping['columns'], taken: Set<number>, numeric: (col: number) => number) {
  const keys = numericKeys.filter((k) => columns[k] !== undefined);
  if (!keys.length) return;
  const score = (off: number) => keys.filter((k) => columns[k]! + off >= 0 && numeric(columns[k]! + off) >= 0.8).length;
  // a tie goes to the offset that puts numbers under «A», the main size (a PDF may print a narrow quantity column as «###»)
  const main = (off: number) => (columns.A !== undefined && columns.A + off >= 0 && numeric(columns.A + off) >= 0.8 ? 1 : 0);
  const best = [0, 1, -1].reduce((b, off) => (score(off) > score(b) || (score(off) === score(b) && main(off) > main(b)) ? off : b), 0);
  if (best === 0) return;
  for (const k of keys) taken.delete(columns[k]!);
  for (const k of keys) { columns[k] = columns[k]! + best; taken.add(columns[k]!); }
}

/** Metres when the header says so or every length is short (the Excel: 1,25 = 1.25 m), else millimetres. */
function guessUnit(table: Table, header: number, col: number | undefined): LengthUnit {
  if (col === undefined) return 'mm';
  const h = header >= 0 ? text(table[header][col]).toLowerCase() : '';
  if (/мм|mm/.test(h)) return 'mm';
  if (/(,|\(|\s)\s*(м|m)\)?$/.test(h)) return 'm';
  const values = table.slice(header + 1).map((r) => cellNumber(r[col])).filter((v): v is number => v !== undefined && v > 0);
  return values.length && Math.max(...values) <= 30 ? 'm' : 'mm';
}

export type ImportStatus = 'ok' | 'unknown' | 'skip';

export interface ImportRow {
  /** 1-based row number in the file. */
  line: number;
  /** The row's cells joined, to show what it was. */
  source: string;
  status: ImportStatus;
  kind?: FittingKind;
  values: Partial<Record<FieldKey, string>>;
  quantity: string;
  position?: string;
  /** The sizes as read, so a kind chosen by hand reads them again. */
  raw: RawSizes;
  /** Fields whose size in the name differs from the size column (ADR 0073); the column wins. */
  conflicts?: SizeConflict[];
  /** The number of text lines of a PDF the row was joined from (a wrapped cell, ADR 0100); absent = one. */
  joined?: number;
  /** The quantity cell holds an Excel error such as «###» (a narrow column in a printed PDF): the quantity is left empty, never 1 (ADR 0115). */
  quantityUnreadable?: boolean;
}

interface RawSizes { cells: Partial<Record<SizeSlot, number>>; sizes: NameSize[]; extra: Partial<Record<SizeSlot, number>> }

/** Shapes of the main and the second size from the columns: A with B is rect, A alone round; the same for a / b. */
function columnShapes(c: Partial<Record<SizeSlot, number>>): NameSize[] {
  const out: NameSize[] = [];
  if (c.A !== undefined) out.push(c.B !== undefined ? { w: c.A, h: c.B } : { d: c.A });
  if (c.a !== undefined) out.push(c.b !== undefined ? { w: c.a, h: c.b } : { d: c.a });
  return out;
}

const fmtMm = (v: number) => String(Math.round(v * 1000) / 1000);

/** Size values from the name, for the slots the columns left empty: the main size, then the small end or branch. */
function nameSlots(kind: FittingKind, sizes: NameSize[]): Partial<Record<SizeSlot, number>> {
  const out: Partial<Record<SizeSlot, number>> = {};
  let list = sizes;
  // a rect-to-round part is keyed by its rect end, whatever order the name gives («ППК Д200/400х200»)
  if (kind === 'rectToRoundReducer') list = [...sizes.filter((s) => !('d' in s)), ...sizes.filter((s) => 'd' in s)];
  const put = (s: NameSize | undefined, big: SizeSlot, high: SizeSlot) => {
    if (!s) return;
    if ('d' in s) out[big] = s.d;
    else { out[big] = s.w; out[high] = s.h; }
  };
  put(list[0], 'A', 'B');
  put(list[1], 'a', 'b');
  return out;
}

/** Form values of one kind from the size columns, then from the name; lengths go to mm. */
export function rowValues(kind: FittingKind, cells: Partial<Record<SizeSlot, number>>, fromName: Partial<Record<SizeSlot, number>>): FormRow['values'] {
  const values: FormRow['values'] = {};
  for (const [slot, key] of Object.entries(slots[kind]) as [SizeSlot, FieldKey][]) {
    const v = cells[slot] ?? fromName[slot];
    if (v !== undefined) values[key] = fmtMm(v);
  }
  return values;
}

/**
 * Every data row of the table as an import row: recognised (`ok`), not recognised (`unknown`, for a manual choice),
 * or `skip` (empty, a total, a heading such as «ПВ1», which then names the system of the rows below it).
 */
export function importRows(table: Table, mapping: Mapping): ImportRow[] {
  const col = mapping.columns;
  const get = (r: Cell[], k: ColumnKey) => (col[k] === undefined ? undefined : r[col[k]!]);
  const toMm = (v: number) => (mapping.lengthUnit === 'm' ? mToMm(v) : v);
  const out: ImportRow[] = [];
  let heading: string | undefined;
  const counters = new Map<string, number>();
  for (let i = mapping.header + 1; i < table.length; i++) {
    const r = table[i];
    const filled = r.filter((c) => text(c) !== '');
    const source = filled.map(text).join(' · ');
    const joined = rowLines.get(r);
    const base = { line: i + 1, source, values: {}, quantity: '1', raw: { cells: {}, sizes: [], extra: {} }, ...(joined ? { joined } : {}) };
    if (!filled.length) continue;
    if (filled.length === 1 && isSystem(filled[0])) {
      heading = text(filled[0]);
      out.push({ ...base, status: 'skip' });
      continue;
    }
    const name = text(get(r, 'name'));
    const code = text(get(r, 'code'));
    const parsed = parseName(name);
    const cells: Partial<Record<SizeSlot, number>> = {};
    for (const s of ['A', 'B', 'a', 'b', 'l', 'R', 'angle', 'L'] as Exclude<SizeSlot, 'H' | 'P' | 'O'>[]) {
      const v = cellNumber(get(r, s));
      if (v !== undefined && v > 0) cells[s] = s === 'L' ? toMm(v) : v;
    }
    // round or rect: from the sizes in the name, else from the size columns (B filled = rect)
    const shapes = parsed.sizes.length ? parsed.sizes : columnShapes(cells);
    const kind = recognizeKind(code || undefined, name || undefined, shapes)
      // a code-less row with a bare code as its name («СНВ» in the name column of the template) still has its sizes in the columns
      ?? (code ? undefined : recognizeKind(undefined, filled.map(text).find((t) => isCode(t)), shapes));
    const extra: Partial<Record<SizeSlot, number>> = {};
    if (parsed.angle !== undefined) extra.angle = parsed.angle;
    if (parsed.length !== undefined) extra.L = parsed.length;
    if (parsed.offset !== undefined) extra.H = parsed.offset;
    if (parsed.partitions !== undefined) extra.P = parsed.partitions;
    if (parsed.openFace) extra.O = 1;
    const raw: RawSizes = { cells, sizes: parsed.sizes, extra };
    const qty = cellNumber(get(r, 'quantity'));
    // «###» or «#VALUE!» in the quantity: the row is kept with an empty quantity, so the card asks for it (ADR 0115)
    const unreadable = qty === undefined && excelError(get(r, 'quantity'));
    const quantity = qty !== undefined ? String(qty) : unreadable ? '' : '1';
    const flag = unreadable ? { quantityUnreadable: true } : {};
    const system = text(get(r, 'system')) || heading;
    const number = text(get(r, 'position'));
    // no number column: the rows of a system are counted (ПВ1-1, ПВ1-2), so the positions stay apart
    const count = (sys: string) => { const n = (counters.get(sys) ?? 0) + 1; counters.set(sys, n); return String(n); };
    const position = number ? [system, number].filter(Boolean).join('-') : system ? `${system}-${count(system)}` : undefined;
    const hasSize = Object.keys(cells).length > 0 || parsed.sizes.length > 0;
    if (!kind) {
      // a row with a size or a quantity may be a part we do not know (утка, адаптер): show it; text only is a total or a note
      const status: ImportStatus = hasSize || (qty !== undefined && name !== '') ? 'unknown' : 'skip';
      out.push({ ...base, status, quantity, position, raw, ...flag });
      continue;
    }
    out.push(withKind({ ...base, quantity, position, raw, status: 'unknown', ...flag }, kind));
  }
  return out;
}

/** The row with a kind chosen by hand (or undefined = skip it); its sizes are read again for that kind. */
export function withKind(row: ImportRow, kind: FittingKind | undefined): ImportRow {
  if (!kind) return { ...row, kind: undefined, status: row.status === 'ok' ? 'unknown' : row.status, values: {} };
  const { cells, sizes, extra } = row.raw;
  // the angle in a name is only an angle on an elbow («ППК ..., тип 4» is not 4°)
  const named = { ...(/Elbow$/.test(kind) ? extra : /Offset$/.test(kind) ? { L: extra.L, H: extra.H } : kind === 'rectBox' ? { L: extra.L, P: extra.P, O: extra.O } : { L: extra.L }), ...nameSlots(kind, sizes) };
  return { ...row, kind, status: 'ok', values: rowValues(kind, cells, named), conflicts: sizeConflicts(kind, cells, named) };
}

/** Fields that both a size column and the name fill, with different values (a typo in one of them); the column value is used. */
export function sizeConflicts(kind: FittingKind, cells: Partial<Record<SizeSlot, number>>, fromName: Partial<Record<SizeSlot, number>>): SizeConflict[] | undefined {
  const out: SizeConflict[] = [];
  for (const [slot, field] of Object.entries(slots[kind]) as [SizeSlot, FieldKey][]) {
    const c = cells[slot];
    const n = fromName[slot];
    if (c !== undefined && n !== undefined && Math.abs(c - n) > 1e-6) out.push({ field, name: fmtMm(n), column: fmtMm(c) });
  }
  return out.length ? out : undefined;
}

/** Form rows of the recognised rows, in file order; missing fields take the kind's prefills, the elbow radius its suggestion. */
export function toFormRows(rows: ImportRow[], firstId: number, config: CalcConfig): FormRow[] {
  const out: FormRow[] = [];
  for (const r of rows) {
    if (r.status !== 'ok' || !r.kind) continue;
    // a cap's rim length is rarely written in a spec; it takes the form default (50 mm), like a new card
    const values = /Cap$/.test(r.kind) ? { ...initialValues(r.kind), length: defaultValues(r.kind).length } : initialValues(r.kind);
    let row: FormRow = { ...newRow(firstId + out.length, r.kind), values, quantity: r.quantity, position: r.position };
    row = applyAutoDefaults(row, config);
    // set every field the file gives; a radius from the file is the user's own value, not the suggestion
    for (const f of kindFields[r.kind]) {
      const v = r.values[f.key];
      if (v !== undefined) row = setFieldValue(row, f.key, v, config);
    }
    if (r.conflicts) row = { ...row, sizeConflicts: r.conflicts };
    // a row the file names but gives no size for is added with a warning, never filled silently
    if (!kindFields[r.kind].some((f) => r.values[f.key] !== undefined)) row = { ...row, noSizes: true };
    if (r.joined) row = { ...row, joinedLines: r.joined };
    out.push(row);
  }
  return out;
}
