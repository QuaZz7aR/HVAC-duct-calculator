import { defaultConfig } from "@/lib/calc/config";
import { autoKey, isAuto } from "@/lib/form/auto-defaults";
import { kindFields, kindOrder, type FieldKey, type FittingKind, type FormRow } from "@/lib/form/fields";
import type { RowOutcome } from "@/lib/form/calculate";
import { uk as dict } from "@/lib/i18n/uk";
import { kindTitle } from "./format";
import { FittingSketch } from "./FittingSketch";
import { ErrorList, WarningList } from "./ErrorList";
import { cardClass, inputClass, labelClass } from "./styles";
import { TextField } from "./TextField";

interface Props {
  row: FormRow;
  index: number;
  outcome: RowOutcome | undefined;
  onKindChange: (kind: FittingKind) => void;
  onValueChange: (key: FieldKey, value: string) => void;
  onReset: (key: FieldKey) => void;
  onPatch: (patch: Partial<FormRow>) => void;
  onRemove: () => void;
}

/** One fitting: kind selector, the size fields that kind needs, quantity. */
export function FittingCard({ row, index, outcome, onKindChange, onValueChange, onReset, onPatch, onRemove }: Props) {
  return (
    <div className={cardClass}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <label className="min-w-0 flex-1 sm:max-w-sm">
          <span className={labelClass}>{index + 1}. {dict.kind}</span>
          <select className={inputClass} value={row.kind} onChange={(e) => onKindChange(e.target.value as FittingKind)}>
            {kindOrder.map((k) => (
              <option key={k} value={k} className="text-black">{kindTitle(k)}</option>
            ))}
          </select>
        </label>
        <button type="button" className="text-sm text-red-600 hover:underline dark:text-red-400" onClick={onRemove}>
          {dict.removeItem}
        </button>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="shrink-0">
          <FittingSketch kind={row.kind} />
          <p className="max-w-40 text-[10px] leading-tight text-zinc-500 dark:text-zinc-400">{dict.sketch.note}</p>
        </div>
      <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {kindFields[row.kind].map((f) => (
          <TextField
            key={f.key}
            label={`${dict.fields[f.key]}${f.optional ? ` (${dict.optional}: ${defaultConfig.reducerLengthMm})` : ""}`}
            value={row.values[f.key] ?? ""}
            onChange={(v) => onValueChange(f.key, v)}
            hint={autoKey(row.kind) === f.key ? (isAuto(row, f.key) && (row.values[f.key] ?? "") !== "" ? dict.autoValue : undefined) : undefined}
            action={autoKey(row.kind) === f.key && !isAuto(row, f.key) ? { label: dict.resetAuto, onClick: () => onReset(f.key) } : undefined}
          />
        ))}
        <TextField label={dict.quantity} inputMode="numeric" value={row.quantity} onChange={(quantity) => onPatch({ quantity })} />
      </div>
      </div>
      {outcome && !outcome.ok && <ErrorList issues={outcome.issues} />}
      {outcome?.ok && <WarningList warnings={outcome.result.warnings} />}
    </div>
  );
}
