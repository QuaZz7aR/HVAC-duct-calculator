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
