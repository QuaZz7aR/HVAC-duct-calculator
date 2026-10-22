import { inputClass, labelClass } from "./styles";

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputMode?: "decimal" | "numeric";
  /** Small note next to the label, e.g. that the value is suggested from the size. */
  hint?: string;
  action?: { label: string; onClick: () => void };
}

export function TextField({ label, value, onChange, inputMode = "decimal", hint, action }: Props) {
  return (
    <label>
      <span className={labelClass}>
        {label}
        {hint && <span className="ml-1 text-blue-600 dark:text-blue-400">({hint})</span>}
        {action && (
          <button type="button" className="ml-1 text-blue-600 hover:underline dark:text-blue-400" onClick={action.onClick}>
            {action.label}
          </button>
        )}
      </span>
      <input className={inputClass} inputMode={inputMode} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
