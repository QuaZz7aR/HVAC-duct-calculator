import type { FieldKey } from "@/lib/form/fields";
import type { FittingWarning } from "@/lib/calc/warnings";
import { issueMessage, warningMessage, type FormIssue } from "@/lib/form/messages";
import { uk as dict } from "@/lib/i18n/uk";

function fieldLabel(issue: FormIssue) {
  const key = String(issue.path[0]);
  if (key === "quantity") return dict.quantity;
  if (key === "seamPercent") return dict.settings.seamPercent;
  if (key === "marginPercent") return dict.settings.marginPercent;
  return dict.fields[key as FieldKey] ?? key;
}

export function ErrorList({ issues }: { issues: FormIssue[] }) {
  if (issues.length === 0) return null;
  return (
    <ul role="alert" className="mt-2 space-y-0.5 text-sm text-red-600 dark:text-red-400">
      {issues.map((i, n) => (
        <li key={n}>
          {fieldLabel(i)}: {issueMessage(i, dict)}
        </li>
      ))}
    </ul>
  );
}

/** Non-blocking advice for a row that calculated fine; strong ones are marked in red. */
export function WarningList({ warnings }: { warnings: FittingWarning[] }) {
  if (warnings.length === 0) return null;
  return (
    <ul aria-label={dict.warnings.title} className="mt-2 space-y-0.5 text-sm">
      {warnings.map((w) => (
        <li key={w.code} className={w.level === "strong" ? "text-red-600 dark:text-red-400" : "text-amber-700 dark:text-amber-400"}>
          ⚠ {warningMessage(w, dict)}
        </li>
      ))}
    </ul>
  );
}
