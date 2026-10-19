/** One band: applies from `fromMm` (inclusive) up to the next row's `fromMm`. */
export interface ThicknessRow {
  fromMm: number; // size where the band starts; the first row must be 0
  thicknessMm: number;
}

export interface ThicknessTable {
  version: string; // bumped on ANY row change
  /** `inclusive`: a band holds sizes >= fromMm. `exclusive`: sizes > fromMm (norm tables that list upper limits, "up to 200 incl."). */
  bandStart: 'inclusive' | 'exclusive';
  round: ThicknessRow[]; // keyed by diameter, ascending fromMm
  rect: ThicknessRow[]; // keyed by larger side, ascending fromMm
}

/** One band: applies from `fromMm` (inclusive) up to the next row's `fromMm`. */
export interface WasteRow {
  fromMm: number; // size where the band starts; the first row must be 0
  factor: number; // multiplier on sheet area
}

export interface WasteFactorTable {
  version: string; // bumped on ANY row change
  default: number; // fittings without a waste factor (everything except elbows)
  round: WasteRow[]; // elbows, keyed by diameter, ascending fromMm
  rect: WasteRow[]; // elbows, keyed by equivalent diameter 2WH/(W+H), ascending fromMm
}

/** Air constants and defaults for airAtConditions (Excel "Шаблон" AP5, AQ5). */
export interface AirConfig {
  gasConstantJPerKgK: number; // specific gas constant of air
  zeroCelsiusK: number; // 0 C in kelvin
  sutherlandMu0KgfSPerM2: number; // dynamic viscosity at 0 C, kgf*s/m2
  sutherlandCK: number; // Sutherland constant, K
  gravityMPerS2: number; // converts kgf*s/m2 to Pa*s
  airTemperatureC: number; // default air temperature
  airPressurePa: number; // default air pressure
}

/** Thresholds of the non-blocking input warnings (warnings.ts). */
export interface WarningConfig {
  aspectRatioWarn: number; // rect: larger side / smaller side at or above this -> warning
  aspectRatioMax: number; // rect: above this -> strong warning (norm limit)
  maxSizeMm: number; // any cross-section dimension above this -> thickness needs a calculation
  elbowInnerRadiusFactor: number; // inner radius above this x width (rect) or diameter (round) -> warning
}

/** A standard sheet of metal, mm. */
export interface SheetSize {
  widthMm: number;
  heightMm: number;
}

/** Ordering of metal: sheet size and the margin on top of the computed area. */
export interface OrderConfig {
  marginPercent: number; // extra metal when ordering, % of the computed area; never changes the computed area
  sheet: SheetSize; // the sheet the count is based on
  sheetSizes: SheetSize[]; // the sizes the UI offers
}

/** Boundary-unit defaults (mm). Convert with units.ts before use in the core. */
export interface CalcConfig {
  air: AirConfig;
  roughnessMm: number; // absolute roughness, steel
  reducerLengthMm: number; // default reducer length
  reducerMinLengthMm: number; // validation floor, never a silent clamp
  thickness: ThicknessTable;
  wasteFactor: WasteFactorTable;
  warnings: WarningConfig;
  order: OrderConfig;
}

/**
 * ДБН В.2.5-67:2013, додаток Ц, п. Ц.2: the sheet thickness is "not more than" the listed value for the listed sizes.
 * Sizes between the listed ones take the next larger listed size (the safe side), so each band starts above the previous limit.
 * TODO(confirm): the between-sizes rule is ours; the norm is a reference table, and it does not cover fire-resistant ducts (at least 0.8 mm, п. 7.11.5).
 * Above 2000 mm the thickness is by calculation (warning `size.overLimit`); the last band is used meanwhile.
 */
export const dbnThickness: ThicknessTable = {
  version: 'dbn-v-2-5-67-2013-1',
  bandStart: 'exclusive',
  // round, by diameter: up to 200 -> 0.5; 250-450 -> 0.6; 500-800 -> 0.7; 900-1250 -> 1.0; 1400-1600 -> 1.2; 1800-2000 -> 1.4
  round: [
    { fromMm: 0, thicknessMm: 0.5 },
    { fromMm: 200, thicknessMm: 0.6 },
    { fromMm: 450, thicknessMm: 0.7 },
    { fromMm: 800, thicknessMm: 1.0 },
    { fromMm: 1250, thicknessMm: 1.2 },
    { fromMm: 1600, thicknessMm: 1.4 },
  ],
  // rect, by the larger side: up to 250 -> 0.5; 300-1000 -> 0.7; 1250-2000 -> 0.9
  rect: [
    { fromMm: 0, thicknessMm: 0.5 },
    { fromMm: 250, thicknessMm: 0.7 },
    { fromMm: 1000, thicknessMm: 0.9 },
  ],
};

/**
 * The engineer's own table: 0.55 mm below 400 mm, 0.7 mm from 400 mm (confirmed 2026-10-16). An option next to the ДБН default.
 * TODO(confirm): rect keyed by the larger side (the Excel used the equivalent diameter, a simplification the engineer acknowledged).
 */
export const engineerThickness: ThicknessTable = {
  version: 'engineer-1',
  bandStart: 'inclusive',
  round: [
    { fromMm: 0, thicknessMm: 0.55 },
    { fromMm: 400, thicknessMm: 0.7 },
  ],
  rect: [
    { fromMm: 0, thicknessMm: 0.55 },
    { fromMm: 400, thicknessMm: 0.7 },
  ],
};

export const defaultConfig: CalcConfig = {
  air: {
    gasConstantJPerKgK: 287,
    zeroCelsiusK: 273, // Excel rounding, kept for consistency with aero fixtures
    sutherlandMu0KgfSPerM2: 1.74e-6,
    sutherlandCK: 114,
    gravityMPerS2: 9.8, // Excel rounding, kept for consistency with aero fixtures
    airTemperatureC: 22,
    airPressurePa: 101308,
  },
  roughnessMm: 0.1,
  reducerLengthMm: 300,
  reducerMinLengthMm: 150,
  thickness: dbnThickness,
  wasteFactor: {
    version: 'placeholder-1',
    // seam allowance ("запас на фальц") for every kind except elbows: 1 + percent / 100, user-set in the UI (engineer 2026-10-19:
    // "if the coefficient is for seams, then for all elements"). 1.0 = off, because the origin of the coefficients is unconfirmed.
    default: 1.0,
    // TODO(confirm): thresholds and factors were copied by the engineer from websites as a safety margin; what they cover (waste, seams, both) is still open (decisions.md, Engineer answers)
    round: [
      { fromMm: 0, factor: 1.15 },
      { fromMm: 315, factor: 1.1 },
    ],
    // TODO(confirm): keyed by equivalent diameter here, while the thickness table keys rect by the larger side
    rect: [
      { fromMm: 0, factor: 1.2 },
      { fromMm: 250, factor: 1.1 },
    ],
  },
  warnings: {
    // engineer (2026-10-16): a rect side 2.5-3x the other is not done in practice, better to warn
    // TODO(confirm): 3 is picked from the engineer's "2.5-3"
    aspectRatioWarn: 3,
    // ДБН В.2.5-67:2013, додаток Ц: rect aspect ratio not above 6.3
    aspectRatioMax: 6.3,
    // ДБН В.2.5-67:2013, додаток Ц: thickness above 2000 mm is by calculation
    maxSizeMm: 2000,
    // TODO(confirm): preliminary threshold (2x width or diameter); the engineer expected inner radii up to 50-150 mm
    elbowInnerRadiusFactor: 2,
  },  order: {
    // engineer (2026-10-19): the 20 % is "probably the margin for ordering metal"
    // TODO(confirm): what the 20 % in his «Специфікація» (AJ30, E51) really is
    marginPercent: 20,
    // standard sheet sizes are a user choice (engineer, 2026-10-19: "google it and make it a parameter")
    // TODO(confirm): 1250 x 2500 is the common default; the list is not from a supplier
    sheet: { widthMm: 1250, heightMm: 2500 },
    sheetSizes: [
      { widthMm: 1000, heightMm: 2000 },
      { widthMm: 1250, heightMm: 2500 },
      { widthMm: 1500, heightMm: 3000 },
    ],
  },
};
