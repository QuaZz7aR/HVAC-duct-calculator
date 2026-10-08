import type { Fitting } from '../calc/types';

export type FittingKind = Fitting['kind'];

export type FieldKey =
  | 'diameter' | 'smallDiameter' | 'width' | 'height' | 'smallWidth' | 'smallHeight'
  | 'length' | 'centerRadius' | 'innerRadius' | 'angle' | 'allowance';

export interface FieldDef {
  key: FieldKey;
  /** Left empty -> the validation layer applies its own default (reducer length from config). */
  optional?: boolean;
  /** Prefilled when a row is created or its kind changes. */
  initial?: string;
}

// TODO(confirm): allowance 50 mm and elbow angle 90 are form prefills only (the fixtures use 50), not core defaults.
const allowance: FieldDef = { key: 'allowance', initial: '50' };
const angle: FieldDef = { key: 'angle', initial: '90' };
const reducerLength: FieldDef = { key: 'length', optional: true };

export const kindOrder: FittingKind[] = [
  'roundStraight', 'rectStraight', 'roundElbow', 'rectElbow',
  'roundReducer', 'rectReducer', 'rectToRoundReducer', 'roundCap', 'rectCap',
];

export const kindFields: Record<FittingKind, FieldDef[]> = {
  roundStraight: [{ key: 'diameter' }, { key: 'length' }],
  rectStraight: [{ key: 'width' }, { key: 'height' }, { key: 'length' }],
  roundCap: [{ key: 'diameter' }, { key: 'length' }],
  rectCap: [{ key: 'width' }, { key: 'height' }, { key: 'length' }],
  roundElbow: [{ key: 'diameter' }, { key: 'centerRadius' }, angle, allowance],
  rectElbow: [{ key: 'width' }, { key: 'height' }, { key: 'innerRadius' }, angle, allowance],
  roundReducer: [{ key: 'diameter' }, { key: 'smallDiameter' }, reducerLength, allowance],
  rectReducer: [
    { key: 'width' }, { key: 'height' }, { key: 'smallWidth' }, { key: 'smallHeight' }, reducerLength, allowance,
  ],
  rectToRoundReducer: [{ key: 'width' }, { key: 'height' }, { key: 'smallDiameter' }, reducerLength, allowance],
};

/** One form row; every value is the raw text the user typed. */
export interface FormRow {
  id: number;
  kind: FittingKind;
  values: Partial<Record<FieldKey, string>>;
  quantity: string;
  flow: string;
  zeta: string;
}

export function initialValues(kind: FittingKind): FormRow['values'] {
  return Object.fromEntries(kindFields[kind].map((f) => [f.key, f.initial ?? '']));
}

export function newRow(id: number, kind: FittingKind = 'roundStraight'): FormRow {
  return { id, kind, values: initialValues(kind), quantity: '1', flow: '', zeta: '' };
}
