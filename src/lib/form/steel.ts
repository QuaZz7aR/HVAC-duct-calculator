import type { OrderLine } from '../calc/sheet-count';

/**
 * Steel of a row (ADR 0120). Galvanized is the default and what every older project used.
 * The thickness comes from the same table for every steel: TODO(confirm) whether stainless or black steel
 * needs its own thickness table (ДБН В.2.5-67:2013 додаток Ц gives one table for steel ducts).
 */
export const steelTypes = ['galvanized', 'stainless', 'black', 'painted'] as const;
export type SteelType = (typeof steelTypes)[number];
export const defaultSteel: SteelType = 'galvanized';

/** Stored or typed text -> a steel type; anything unknown or empty is the default. */
export const toSteel = (v: unknown): SteelType =>
  typeof v === 'string' && (steelTypes as readonly string[]).includes(v) ? (v as SteelType) : defaultSteel;

/** A sheet-list line of one steel and one thickness. `steel` absent = galvanized. */
export type SteelLine = OrderLine & { steel?: SteelType };
