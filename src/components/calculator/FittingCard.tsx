import { defaultConfig } from "@/lib/calc/config";
import { kindFields, kindOrder, type FieldKey, type FittingKind, type FormRow } from "@/lib/form/fields";
import type { RowOutcome } from "@/lib/form/calculate";
import { uk as dict } from "@/lib/i18n/uk";
import { kindTitle } from "./format";
import { ErrorList, WarningList } from "./ErrorList";
import { cardClass, inputClass, labelClass } from "./styles";
import { TextField } from "./TextField";

interface Props {
  row: FormRow;
  index: number;
  outcome: RowOutcome | undefined;
  onKindChange: (kind: FittingKind) => void;
  onValueChange: (key: FieldKey, value: string) => void;
  onPatch: (patch: Partial<FormRow>) => void;
  onRemove: () => void;
}

/** One fitting: kind selector, the size fields that kind needs, quantity. */
export function FittingCard({ row, index, outcome, onKindChange, onValueChange, onPatch, onRemove }: Props) {
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {kindFields[row.kind].map((f) => (
          <TextField
            key={f.key}
            label={`${dict.fields[f.key]}${f.optional ? ` (${dict.optional}: ${defaultConfig.reducerLengthMm})` : ""}`}
            value={row.values[f.key] ?? ""}
            onChange={(v) => onValueChange(f.key, v)}
          />
        ))}
        <TextField label={dict.quantity} inputMode="numeric" value={row.quantity} onChange={(quantity) => onPatch({ quantity })} />
      </div>
      {outcome && !outcome.ok && <ErrorList issues={outcome.issues} />}
      {outcome?.ok && <WarningList warnings={outcome.result.warnings} />}
    </div>
  );
}
