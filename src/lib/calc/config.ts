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

/** Boundary-unit defaults (mm). Convert with units.ts before use in the core. */
export interface CalcConfig {
  air: AirConfig;
  roughnessMm: number; // absolute roughness, steel
  reducerLengthMm: number; // default reducer length
  reducerMinLengthMm: number; // validation floor, never a silent clamp
  thickness: ThicknessTable;
  wasteFactor: WasteFactorTable;
  warnings: WarningConfig;
}

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
  thickness: {
    version: 'placeholder-1',
    // TODO(confirm): thresholds 400 mm / 0.55 / 0.7 confirmed by the engineer (2026-10-16); ДБН В.2.5-67:2013 додаток Ц has a different table (no 0.55), possible second option
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
  wasteFactor: {
    version: 'placeholder-1',
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
  },
};
