import type { ErrorCode, ValidationIssue } from '../validation';
import type { Dictionary } from '../i18n/uk';

/** Form-level codes the Zod layer does not own (the sheet-list item schema is deferred). */
export type FormIssueCode = ErrorCode | 'quantity.invalid';

export interface FormIssue {
  code: FormIssueCode;
  path: ValidationIssue['path'];
}

/** The only place that turns an error code into human text. */
export function issueMessage(issue: { code: FormIssueCode }, dict: Dictionary): string {
  return dict.errors[issue.code];
}
