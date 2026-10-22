import { useState } from "react";
import { defaultConfig } from "@/lib/calc/config";
import { autoKey, isAuto } from "@/lib/form/auto-defaults";
import { kindFields, kindOrder, type FieldKey, type FittingKind, type FormRow } from "@/lib/form/fields";
import type { RowOutcome } from "@/lib/form/calculate";
import { uk as dict } from "@/lib/i18n/uk";
import { kindTitle } from "./format";
import { FittingSketch } from "./FittingSketch";
import { profileLegend, sketchLegend } from "./sketch-spec";
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
  const [showSketch, setShowSketch] = useState(false);
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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
      <button
        type="button"
        className="mt-3 text-sm text-blue-600 underline hover:text-blue-700 dark:text-blue-400"
        aria-expanded={showSketch}
        onClick={() => setShowSketch((v) => !v)}
      >
        {showSketch ? dict.sketch.hide : dict.sketch.show}
      </button>
      {showSketch && (
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {([["side", dict.sketch.sideTitle, sketchLegend(row.kind)], ["profile", dict.sketch.profileTitle, profileLegend(row.kind)]] as const).map(([view, title, legend]) => (
            <figure key={view} className="min-w-0">
              <FittingSketch kind={row.kind} view={view} />
              <figcaption className="mt-1 text-sm leading-snug">
                <strong className="block text-xs uppercase tracking-wide text-zinc-600 dark:text-zinc-400">{title}</strong>
                <span className="text-zinc-600 dark:text-zinc-400">{legend.join("; ")}.</span>
              </figcaption>
            </figure>
          ))}
          <p className="text-sm text-zinc-600 dark:text-zinc-400 sm:col-span-2">{dict.sketch.note}</p>
        </div>
      )}
      {outcome && !outcome.ok && <ErrorList issues={outcome.issues} />}
      {outcome?.ok && <WarningList warnings={outcome.result.warnings} />}
    </div>
  );
}
