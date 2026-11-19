import { Info } from "./Info";
import { inputClass, labelClass } from "./styles";

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputMode?: "decimal" | "numeric" | "text";
  /** Small note next to the label, e.g. that the value is suggested from the size. */
  hint?: string;
  action?: { label: string; onClick: () => void };
  /** Phone: take both columns of the card (a long label), so the neighbour is not misaligned. */
  wide?: boolean;
  /** Explanation behind an «i» button after the label. */
  info?: string;
  placeholder?: string;
}

export function TextField({ label, value, onChange, inputMode = "decimal", hint, action, wide, info, placeholder }: Props) {
  return (
    // a column packed to the bottom: a neighbour label that wraps to two lines leaves this label right above its input, and the inputs stay level
    <label className={`flex flex-col justify-end ${wide ? "col-span-2 sm:col-span-1" : ""}`}>
      <span className={labelClass}>
        {label}
        {info && <Info text={info} />}
        {hint && <span className="ml-1 text-accent">({hint})</span>}
        {action && (
          <button type="button" className="ml-1 text-accent underline" onClick={action.onClick}>
            {action.label}
          </button>
        )}
      </span>
      <input className={inputClass} inputMode={inputMode} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
