import type { FieldKey } from "@/lib/form/fields";
import { issueMessage, type FormIssue } from "@/lib/form/messages";
import { uk as dict } from "@/lib/i18n/uk";

function fieldLabel(issue: FormIssue) {
  const key = String(issue.path[0]);
  if (key === "quantity") return dict.quantity;
  if (key === "flow") return dict.flow;
  if (key === "zeta") return dict.zeta;
  if (key === "temperatureC") return dict.airTemperature;
  if (key === "pressurePa") return dict.airPressure;
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
