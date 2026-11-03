// the field look of `inputClass`, narrow and compact to fit a table cell
const priceClass =
  "w-24 rounded-md border border-line bg-background px-2 py-0.5 text-right font-mono text-base tabular-nums text-foreground focus:outline-2 focus:outline-accent";

/** A price cell in a list table: a narrow decimal input named by `label` for screen readers. */
export function PriceInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <input
      className={priceClass}
      inputMode="decimal"
      aria-label={label}
      placeholder="—"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
