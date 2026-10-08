import type { z } from 'zod';
import { errorCodes, type ErrorCode, type ValidationIssue } from './codes';

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; issues: ValidationIssue[] };

const known = new Set<string>(errorCodes);

/** The only place that turns Zod issues into `{ code, path }`. */
function toIssue(iss: z.core.$ZodIssue): ValidationIssue {
  const path = iss.path.filter((p): p is string | number => typeof p !== 'symbol');
  if (iss.code === 'unrecognized_keys') return { code: 'input.unknownKey', path };
  return { code: known.has(iss.message) ? (iss.message as ErrorCode) : 'input.invalid', path };
}

export function validate<S extends z.ZodType>(schema: S, input: unknown): ValidationResult<z.output<S>> {
  const r = schema.safeParse(input);
  return r.success ? { ok: true, value: r.data } : { ok: false, issues: r.error.issues.map(toIssue) };
}
