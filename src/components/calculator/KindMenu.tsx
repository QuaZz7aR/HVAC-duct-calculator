import { useRef, useState } from "react";
import type { FittingKind } from "@/lib/form/fields";
import { kindGroups } from "@/lib/form/kind-groups";
import { uk as dict } from "@/lib/i18n/uk";
import { buttonClass } from "./styles";
import { useDismiss } from "./useDismiss";

/** "⋯" button of a card: opens the list of kinds to switch this row to (sizes then restart from the new kind's defaults). */
export function KindMenu({ kind, onChange }: { kind: FittingKind; onChange: (kind: FittingKind) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, open, () => setOpen(false));
  return (
    <div ref={ref} className="relative">
      <button type="button" className={buttonClass} aria-expanded={open} aria-label={dict.palette.changeKind} title={dict.palette.changeKind} onClick={() => setOpen(!open)}>
        ⋯
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 max-h-80 w-80 overflow-y-auto rounded-lg border border-line bg-panel p-1.5 shadow-xl shadow-black/30">
          <p className="px-1.5 pb-1 text-xs uppercase tracking-wider text-muted">{dict.palette.changeKindTo}</p>
          <div className="grid grid-cols-[auto_1fr] gap-x-3">
          {kindGroups.flatMap((g) => g.kinds).map((k) => (
            <button
              key={k}
              type="button"
              disabled={k === kind}
              onClick={() => {
                setOpen(false);
                onChange(k);
              }}
              className="col-span-2 grid w-full grid-cols-subgrid rounded-md px-1.5 py-1.5 text-left text-sm hover:bg-accent-soft disabled:opacity-50 disabled:hover:bg-transparent"
            >
              <span className="font-mono text-sm text-accent">{dict.kinds[k].designation}</span>
              <span className="leading-tight">{dict.kinds[k].name}</span>
            </button>
          ))}
          </div>
        </div>
      )}
    </div>
  );
}
