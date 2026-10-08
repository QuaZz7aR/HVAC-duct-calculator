/** Stable machine-readable error codes. The UI translates them later; never put human text here. */
export const errorCodes = [
  'field.required',
  'field.invalid',
  'size.nonPositive',
  'size.notFinite',
  'allowance.negative',
  'angle.outOfRange',
  'reducer.tooShort',
  'reducer.noSizeChange',
  'flow.nonPositive',
  'coefficient.negative',
  'roughness.negative',
  'air.temperatureTooLow',
  'air.pressureNonPositive',
  'kind.unknown',
  'input.unknownKey',
  'input.invalid',
] as const;

export type ErrorCode = (typeof errorCodes)[number];

export interface ValidationIssue {
  code: ErrorCode;
  path: (string | number)[];
}
