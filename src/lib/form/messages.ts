import type { FittingWarning } from '../calc/warnings';
import type { ErrorCode, ValidationIssue } from '../validation';
import type { Dictionary } from '../i18n/uk';

/** The form shows the same stable codes the Zod layer produces. */
export type FormIssueCode = ErrorCode;

export interface FormIssue {
  code: FormIssueCode;
  path: ValidationIssue['path'];
}

/** The only place that turns an error code into human text. */
export function issueMessage(issue: { code: FormIssueCode }, dict: Dictionary): string {
  return dict.errors[issue.code];
}

/** Warning text with the numbers filled in (decimal comma, as the UI shows them). */
export function warningMessage(w: FittingWarning, dict: Dictionary): string {
  // the value is rounded up so the text never says a number exceeds an identical one
  const n = (x: number, up = false) => String((up ? Math.ceil(x * 100 - 1e-9) : Math.round(x * 100)) / 100).replace('.', ',');
  return dict.warnings[w.code](n(w.value, true), n(w.limit));
}
