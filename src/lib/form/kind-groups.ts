import { uk as dict } from '../i18n/uk';
import type { FittingKind, FormRow } from './fields';

export type KindGroupId = 'straight' | 'elbow' | 'reducer' | 'cap' | 'tap' | 'tee' | 'cross';

/** The kinds as the side panel lists them: seven groups, each in the order of `kindOrder`. */
export const kindGroups: { id: KindGroupId; kinds: FittingKind[] }[] = [
  { id: 'straight', kinds: ['roundStraight', 'rectStraight'] },
  { id: 'elbow', kinds: ['roundElbow', 'rectElbow'] },
  { id: 'reducer', kinds: ['roundReducer', 'rectReducer', 'rectToRoundReducer'] },
  { id: 'cap', kinds: ['roundCap', 'rectCap'] },
  { id: 'tap', kinds: ['roundTap', 'rectTap'] },
  { id: 'tee', kinds: ['roundTee', 'roundTeeRectBranch', 'rectTee', 'rectTeeRoundBranch'] },
  { id: 'cross', kinds: ['roundCross', 'roundCrossRectBranches', 'rectCross', 'rectCrossRoundBranches'] },
];

/** The kinds the phone shows as quick buttons above the list. */
export const quickKinds: FittingKind[] = ['roundStraight', 'rectStraight', 'roundElbow', 'rectElbow', 'roundReducer', 'rectReducer', 'roundTee', 'rectTee'];

/** Where a new row of `kind` goes: right after the last row of the same kind (so it lands in its section), else at the end. */
export function insertIndex(rows: readonly Pick<FormRow, 'kind'>[], kind: FittingKind): number {
  for (let i = rows.length - 1; i >= 0; i--) if (rows[i].kind === kind) return i + 1;
  return rows.length;
}

/** Groups with the kinds that match the query in the designation or the name (case-insensitive); empty groups are dropped. */
export function searchKinds(query: string): { id: KindGroupId; kinds: FittingKind[] }[] {
  const q = query.trim().toLowerCase();
  if (!q) return kindGroups;
  const hit = (k: FittingKind) => `${dict.kinds[k].designation} ${dict.kinds[k].name}`.toLowerCase().includes(q);
  return kindGroups.map((g) => ({ id: g.id, kinds: g.kinds.filter(hit) })).filter((g) => g.kinds.length > 0);
}
