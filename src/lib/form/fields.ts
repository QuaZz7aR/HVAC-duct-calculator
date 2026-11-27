import { defaultConfig } from '../calc/config';
import type { Fitting } from '../calc/types';

export type FittingKind = Fitting['kind'];

export type FieldKey =
  | 'diameter' | 'smallDiameter' | 'width' | 'height' | 'smallWidth' | 'smallHeight'
  | 'length' | 'centerRadius' | 'innerRadius' | 'angle' | 'allowance'
  | 'branchDiameter' | 'branchWidth' | 'branchHeight' | 'maxPiece'
  | 'offset' | 'ends' | 'partitions' | 'openFaces';

export interface FieldDef {
  key: FieldKey;
  /** Left empty -> the validation layer applies its own default (reducer length from config). */
  optional?: boolean;
  /** Prefilled when a row is created or its kind changes. */
  initial?: string;
  /** Form only: not part of the core fitting (the straight piece length, ADR 0045). */
  formOnly?: boolean;
}

// TODO(confirm): allowance 50 mm and elbow angle 90 are form prefills only (the fixtures use 50), not core defaults.
const allowance: FieldDef = { key: 'allowance', initial: '50' };
const angle: FieldDef = { key: 'angle', initial: '90' };
// TODO(confirm): the 100 mm tap length is a form prefill only (Excel Квр / Пвр column J; ВСН 353-86 п. 1.5 / 2.5: h = 100 mm), not a core default.
const tapLength: FieldDef = { key: 'length', initial: '100' };
const maxPiece = (mm: number): FieldDef => ({ key: 'maxPiece', formOnly: true, initial: String(mm) });
// TODO(confirm): casing length prefill of dampers and check valves (ADR 0120), config.valve
const damperLength: FieldDef = { key: 'length', initial: String(defaultConfig.valve.damperMm) };
const checkValveLength: FieldDef = { key: 'length', initial: String(defaultConfig.valve.checkValveMm) };
const reducerLength: FieldDef = { key: 'length', optional: true };

export const kindOrder: FittingKind[] = [
  'roundStraight', 'rectStraight', 'roundElbow', 'rectElbow',
  'roundReducer', 'rectReducer', 'rectToRoundReducer', 'roundCap', 'rectCap',
  'roundTap', 'rectTap',
  'roundDamper', 'rectDamper', 'roundCheckValve', 'rectCheckValve',
  'roundTee', 'roundTeeRectBranch', 'rectTee', 'rectTeeRoundBranch',
  'roundCross', 'roundCrossRectBranches', 'rectCross', 'rectCrossRoundBranches',
  'rectBox', 'roundOffset', 'rectOffset',
];

/** BETA kinds (ADR 0113): formulas from open sources, not yet confirmed by the engineer; the UI marks them. */
export const betaKinds: ReadonlySet<FittingKind> = new Set<FittingKind>(['rectBox', 'roundOffset', 'rectOffset']);

export const kindFields: Record<FittingKind, FieldDef[]> = {
  roundTee: [{ key: 'diameter' }, { key: 'branchDiameter' }, allowance],
  roundTeeRectBranch: [{ key: 'diameter' }, { key: 'branchWidth' }, { key: 'branchHeight' }, allowance],
  rectTee: [{ key: 'width' }, { key: 'height' }, { key: 'branchWidth' }, { key: 'branchHeight' }, allowance],
  rectTeeRoundBranch: [{ key: 'width' }, { key: 'height' }, { key: 'branchDiameter' }, allowance],
  roundCross: [{ key: 'diameter' }, { key: 'branchDiameter' }, allowance],
  roundCrossRectBranches: [{ key: 'diameter' }, { key: 'branchWidth' }, { key: 'branchHeight' }, allowance],
  rectCross: [{ key: 'width' }, { key: 'height' }, { key: 'branchWidth' }, { key: 'branchHeight' }, allowance],
  rectCrossRoundBranches: [{ key: 'width' }, { key: 'height' }, { key: 'branchDiameter' }, allowance],
  roundStraight: [{ key: 'diameter' }, { key: 'length' }, maxPiece(defaultConfig.straightPiece.roundMm)],
  rectStraight: [{ key: 'width' }, { key: 'height' }, { key: 'length' }, maxPiece(defaultConfig.straightPiece.rectMm)],
  roundCap: [{ key: 'diameter' }, { key: 'length' }],
  rectCap: [{ key: 'width' }, { key: 'height' }, { key: 'length' }],
  roundTap: [{ key: 'diameter' }, tapLength],
  rectTap: [{ key: 'width' }, { key: 'height' }, tapLength],
  roundDamper: [{ key: 'diameter' }, damperLength],
  rectDamper: [{ key: 'width' }, { key: 'height' }, damperLength],
  roundCheckValve: [{ key: 'diameter' }, checkValveLength],
  rectCheckValve: [{ key: 'width' }, { key: 'height' }, checkValveLength],
  roundElbow: [{ key: 'diameter' }, { key: 'centerRadius' }, angle, allowance],
  rectElbow: [{ key: 'width' }, { key: 'height' }, { key: 'innerRadius' }, angle, allowance],
  roundReducer: [{ key: 'diameter' }, { key: 'smallDiameter' }, reducerLength, allowance],
  rectReducer: [
    { key: 'width' }, { key: 'height' }, { key: 'smallWidth' }, { key: 'smallHeight' }, reducerLength, allowance,
  ],
  rectToRoundReducer: [{ key: 'width' }, { key: 'height' }, { key: 'smallDiameter' }, reducerLength, allowance],
  // TODO(confirm): a box with both end plates as the prefill; partitions are not counted by the form (owner 2026-11-27, ADR 0118) (the engineer's template «Адаптор» is a closed box)
  rectBox: [{ key: 'width' }, { key: 'height' }, { key: 'length' }, { key: 'ends', initial: '2' }, { key: 'openFaces', initial: '0' }],
  roundOffset: [{ key: 'diameter' }, { key: 'length' }, { key: 'offset' }, allowance],
  rectOffset: [{ key: 'width' }, { key: 'height' }, { key: 'length' }, { key: 'offset' }, allowance],
};

/** One form row; every value is the raw text the user typed. */
export interface FormRow {
  id: number;
  kind: FittingKind;
  values: Partial<Record<FieldKey, string>>;
  quantity: string;
  flow: string;
  zeta: string;
  /** How many ends get the allowance ('2', '1' or '0', ADR 0041); empty or absent = 2. Used only by kinds with an allowance field. */
  allowanceCount?: string;
  /** Saddle on a round main (ADR 0118): taps take the main diameter in mm as text (empty = a flat wall), round-main tees and crosses '1' (on) or empty. */
  saddle?: string;
  /** Insulation material code (config.insulation.materials); empty or absent = not insulated. */
  insulation?: string;
  /** Auto-filled fields (see auto-defaults.ts) that the user has typed over; they stop following the size. */
  manual?: FieldKey[];
  /** Position label typed by the user (П1, В2); empty or absent = the list number (ADR 0049). */
  position?: string;
  /** The values are the untouched defaults of the kind (see defaults.ts); the card says so until the user edits something. */
  preset?: boolean;
  /** Imported sizes whose name and size column disagree (ADR 0073): the column value was taken; shown as a warning until the field is edited. */
  sizeConflicts?: SizeConflict[];
  /** imported from a file row that gave no value for any field; cleared on the first edit or kind change (ADR 0074) */
  noSizes?: boolean;
  /** imported from a PDF row whose text was joined from this many wrapped lines (ADR 0100); cleared on the first edit or kind change */
  joinedLines?: number;
}

/** One field whose size in the fitting's name differs from the value in its column of the imported file (both in mm or degrees). */
export interface SizeConflict { field: FieldKey; name: string; column: string }

export function initialValues(kind: FittingKind): FormRow['values'] {
  return Object.fromEntries(kindFields[kind].map((f) => [f.key, f.initial ?? '']));
}

export function newRow(id: number, kind: FittingKind = 'roundStraight'): FormRow {
  return { id, kind, values: initialValues(kind), quantity: '1', flow: '', zeta: '' };
}

/** The kind has an allowance, so the number of allowances applies to it. */
export const hasAllowance = (kind: FittingKind) => kindFields[kind].some((f) => f.key === 'allowance');

/** Kinds whose branch can sit on a round main and so take the saddle choice (ADR 0118). */
export const saddleKinds: ReadonlySet<FittingKind> = new Set<FittingKind>(['roundTap', 'rectTap', 'roundTee', 'roundTeeRectBranch', 'roundCross', 'roundCrossRectBranches']);
export const isTap = (k: FittingKind) => k === 'roundTap' || k === 'rectTap';
