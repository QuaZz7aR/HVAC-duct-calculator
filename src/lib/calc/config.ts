/** One band: applies from `fromMm` (inclusive) up to the next row's `fromMm`. */
export interface ThicknessRow {
  fromMm: number; // size where the band starts; the first row must be 0
  thicknessMm: number;
}

export interface ThicknessTable {
  version: string; // bumped on ANY row change
  round: ThicknessRow[]; // keyed by diameter, ascending fromMm
  rect: ThicknessRow[]; // keyed by larger side, ascending fromMm
}

/** Boundary-unit defaults (mm). Convert with units.ts before use in the core. */
export interface CalcConfig {
  roughnessMm: number; // absolute roughness, steel
  reducerLengthMm: number; // default reducer length
  reducerMinLengthMm: number; // validation floor, never a silent clamp
  thickness: ThicknessTable;
}

export const defaultConfig: CalcConfig = {
  roughnessMm: 0.1,
  reducerLengthMm: 300,
  reducerMinLengthMm: 150,
  thickness: {
    version: 'placeholder-1',
    // TODO(confirm): thresholds and thicknesses are Excel placeholders, unconfirmed
    round: [
      { fromMm: 0, thicknessMm: 0.55 },
      { fromMm: 400, thicknessMm: 0.7 },
    ],
    // TODO(confirm): rect keyed by the larger side (CLAUDE.md); Excel used equivalent diameter
    rect: [
      { fromMm: 0, thicknessMm: 0.55 },
      { fromMm: 400, thicknessMm: 0.7 },
    ],
  },
};
