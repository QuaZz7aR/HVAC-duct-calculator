import { kindFields, type FieldKey, type FittingKind, type FormRow } from './fields';
import { defaultConfig } from '../calc/config';
import { defaultSettings, sheetKey, thicknessTables, type SettingsText } from './settings';
import { emptyPrices, type PriceText } from './price';
import type { EquipmentOpeningText, EquipmentRow } from './equipment';

/** localStorage key of the saved project (ADR 0101). */
export const projectKey = 'project';
/** Schema version of the saved project; a newer or unknown version is not read. */
export const projectVersion = 1;

/** What the browser keeps between visits: the rows (order, positions, values), the settings and the prices. */
export interface SavedProject {
  rows: FormRow[];
  settings: SettingsText;
  prices: PriceText;
  /** equipment rows (ADR 0120); absent in projects saved before it = none */
  equipment?: EquipmentRow[];
}

/** The saved form as JSON text; `flow` / `zeta` are hidden inputs and are not kept. */
export function serializeProject(p: SavedProject): string {
  return JSON.stringify({
    version: projectVersion,
    rows: p.rows.map((r) => ({ ...r, flow: undefined, zeta: undefined })),
    settings: p.settings,
    prices: p.prices,
    equipment: p.equipment ?? [],
  });
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined);

function textMap(v: unknown): Record<string, string> {
  if (!isObj(v)) return {};
  return Object.fromEntries(Object.entries(v).filter((e): e is [string, string] => typeof e[1] === 'string'));
}

/** One saved row, or undefined when it cannot be a row (unknown kind, bad id). Unknown fields are dropped. */
function parseRow(v: unknown): FormRow | undefined {
  if (!isObj(v)) return undefined;
  const kind = v.kind as FittingKind;
  if (typeof kind !== 'string' || !Object.hasOwn(kindFields, kind)) return undefined;
  if (typeof v.id !== 'number' || !Number.isInteger(v.id) || v.id < 1) return undefined;
  const keys = new Set<string>(kindFields[kind].map((f) => f.key));
  const saved = textMap(v.values);
  const values = Object.fromEntries(kindFields[kind].map((f) => [f.key, saved[f.key] ?? f.initial ?? ''])) as FormRow['values'];
  const row: FormRow = { id: v.id, kind, values, quantity: str(v.quantity) ?? '1', flow: '', zeta: '' };
  const opt = (k: 'allowanceCount' | 'insulation' | 'position' | 'saddle') => {
    const s = str(v[k]);
    if (s !== undefined) row[k] = s;
  };
  opt('allowanceCount');
  opt('insulation');
  opt('position');
  opt('saddle');
  if (Array.isArray(v.manual)) row.manual = v.manual.filter((k): k is FieldKey => typeof k === 'string' && keys.has(k));
  if (v.preset === true) row.preset = true;
  if (v.noSizes === true) row.noSizes = true;
  if (typeof v.joinedLines === 'number' && Number.isInteger(v.joinedLines) && v.joinedLines > 1) row.joinedLines = v.joinedLines;
  if (Array.isArray(v.sizeConflicts)) {
    const c = v.sizeConflicts.filter(
      (x): x is { field: FieldKey; name: string; column: string } =>
        isObj(x) && typeof x.field === 'string' && keys.has(x.field) && typeof x.name === 'string' && typeof x.column === 'string',
    );
    if (c.length) row.sizeConflicts = c.map(({ field, name, column }) => ({ field, name, column }));
  }
  return row;
}

/** One saved equipment row, or undefined when the id is bad; missing text fields are empty, broken openings are dropped. */
function parseEquipment(v: unknown): EquipmentRow | undefined {
  if (!isObj(v) || typeof v.id !== 'number' || !Number.isInteger(v.id) || v.id < 1) return undefined;
  const openings: EquipmentOpeningText[] = (Array.isArray(v.openings) ? v.openings : [])
    .filter((o): o is Record<string, unknown> => isObj(o) && (o.shape === 'round' || o.shape === 'rect'))
    .map((o) => ({ shape: o.shape as EquipmentOpeningText['shape'], a: str(o.a) ?? '', b: str(o.b) ?? '' }));
  return {
    id: v.id, name: str(v.name) ?? '', length: str(v.length) ?? '', width: str(v.width) ?? '', height: str(v.height) ?? '',
    openings, quantity: str(v.quantity) ?? '1', insulation: str(v.insulation) ?? '',
  };
}

function parseSettings(v: unknown): SettingsText {
  const d = defaultSettings();
  if (!isObj(v)) return d;
  const table = v.thicknessTable;
  return {
    thicknessTable: typeof table === 'string' && Object.hasOwn(thicknessTables, table) ? (table as SettingsText['thicknessTable']) : d.thicknessTable,
    seamPercent: str(v.seamPercent) ?? d.seamPercent,
    marginPercent: str(v.marginPercent) ?? d.marginPercent,
    // a sheet size no longer offered takes the default, so the select always shows a listed size
    sheet: defaultConfig.order.sheetSizes.some((s) => sheetKey(s) === v.sheet) ? (v.sheet as string) : d.sheet,
  };
}

/**
 * The project saved by `serializeProject`, or undefined when there is none or it is not readable (bad JSON, other version).
 * A readable project keeps what it can: a broken row is skipped, a broken setting or price takes its default; duplicate ids keep the first.
 */
export function parseProject(text: string | null | undefined): SavedProject | undefined {
  if (!text) return undefined;
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return undefined;
  }
  if (!isObj(data) || data.version !== projectVersion || !Array.isArray(data.rows)) return undefined;
  const seen = new Set<number>();
  const rows: FormRow[] = [];
  for (const r of data.rows) {
    const row = parseRow(r);
    if (row && !seen.has(row.id)) {
      seen.add(row.id);
      rows.push(row);
    }
  }
  const prices = isObj(data.prices) ? { metal: textMap(data.prices.metal), insulation: textMap(data.prices.insulation) } : emptyPrices();
  const ids = new Set<number>();
  const equipment = (Array.isArray(data.equipment) ? data.equipment : [])
    .map(parseEquipment)
    .filter((e): e is EquipmentRow => e !== undefined && !ids.has(e.id) && (ids.add(e.id), true));
  return { rows, settings: parseSettings(data.settings), prices, equipment };
}
