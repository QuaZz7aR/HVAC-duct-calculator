import { inputClass, labelClass } from "./styles";

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputMode?: "decimal" | "numeric";
  /** Small note next to the label, e.g. that the value is suggested from the size. */
  hint?: string;
  action?: { label: string; onClick: () => void };
  /** Phone: take both columns of the card (a long label), so the neighbour is not misaligned. */
  wide?: boolean;
}

export function TextField({ label, value, onChange, inputMode = "decimal", hint, action, wide }: Props) {
  return (
    <label className={wide ? "col-span-2 sm:col-span-1" : undefined}>
      <span className={labelClass}>
        {label}
        {hint && <span className="ml-1 text-accent">({hint})</span>}
        {action && (
          <button type="button" className="ml-1 text-accent underline" onClick={action.onClick}>
            {action.label}
          </button>
        )}
      </span>
      <input className={inputClass} inputMode={inputMode} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
