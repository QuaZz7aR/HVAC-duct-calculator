import type { RowOutcome } from "@/lib/form/calculate";
import type { FieldKey, FittingKind, FormRow } from "@/lib/form/fields";
import { uk as dict } from "@/lib/i18n/uk";
import { FittingCard } from "./FittingCard";

interface Props {
  rows: FormRow[];
  outcome: (id: number) => RowOutcome | undefined;
  onKindChange: (id: number, kind: FittingKind) => void;
  onValueChange: (id: number, key: FieldKey, value: string) => void;
  onPatch: (id: number, patch: Partial<FormRow>) => void;
  onRemove: (id: number) => void;
  onAdd: () => void;
}

export function FittingList({ rows, outcome, onKindChange, onValueChange, onPatch, onRemove, onAdd }: Props) {
  return (
    <section aria-labelledby="items-title" className="space-y-3">
      <h2 id="items-title" className="font-medium">{dict.itemsTitle}</h2>
      {rows.map((row, idx) => (
        <FittingCard
          key={row.id}
          row={row}
          index={idx}
          outcome={outcome(row.id)}
          onKindChange={(kind) => onKindChange(row.id, kind)}
          onValueChange={(key, value) => onValueChange(row.id, key, value)}
          onPatch={(patch) => onPatch(row.id, patch)}
          onRemove={() => onRemove(row.id)}
        />
      ))}
      <button type="button" className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700" onClick={onAdd}>
        + {dict.addItem}
      </button>
    </section>
  );
}
