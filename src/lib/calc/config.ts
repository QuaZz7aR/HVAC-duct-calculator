/** Boundary-unit defaults (mm). Convert with units.ts before use in the core. */
export interface CalcConfig {
  roughnessMm: number; // absolute roughness, steel
  reducerLengthMm: number; // default reducer length
  reducerMinLengthMm: number; // validation floor, never a silent clamp
}

export const defaultConfig: CalcConfig = {
  roughnessMm: 0.1,
  reducerLengthMm: 300,
  reducerMinLengthMm: 150,
};
