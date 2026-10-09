import { inputClass, labelClass } from "./styles";

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputMode?: "decimal" | "numeric";
}

export function TextField({ label, value, onChange, inputMode = "decimal" }: Props) {
  return (
    <label>
      <span className={labelClass}>{label}</span>
      <input className={inputClass} inputMode={inputMode} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
