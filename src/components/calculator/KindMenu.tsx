import { useLayoutEffect, useRef, useState } from "react";
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
  // The menu hangs from the right edge of the "..." button; on a phone the button is near the left edge, so the menu is shifted back into the screen.
  const menuRef = useRef<HTMLDivElement>(null);
  const [shift, setShift] = useState(0);
  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!open || !menu) return setShift(0);
    const { left, right } = menu.getBoundingClientRect();
    const edge = 8;
    const width = document.documentElement.clientWidth;
    setShift(left < edge ? edge - left : right > width - edge ? width - edge - right : 0);
    // a tall menu opening near the bottom of the screen is brought into view
    menu.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button type="button" className={buttonClass} aria-expanded={open} aria-label={dict.palette.changeKind} title={dict.palette.changeKind} onClick={() => setOpen(!open)}>
        ⋯
      </button>
      {open && (
        <div ref={menuRef} style={{ transform: `translateX(${shift}px)` }} className="absolute right-0 top-full z-40 mt-1 max-h-[calc(100svh-6rem)] w-[calc(100vw-1rem)] overflow-y-auto rounded-lg border border-line bg-panel p-2 shadow-xl shadow-black/30 sm:max-h-none sm:w-[44rem] sm:overflow-visible sm:p-3 lg:w-[60rem]">
          <p className="px-1.5 pb-1 text-xs uppercase tracking-wider text-muted sm:pb-2">{dict.palette.changeKindTo}</p>
          {/* the groups flow into columns (2, 2, 3 by width) so the list does not scroll; on a phone a button stacks the designation over the name */}
          <div className="columns-2 gap-x-3 sm:gap-x-6 lg:columns-3">
            {kindGroups.map((g) => (
              <div key={g.id} className="mb-3 grid break-inside-avoid grid-cols-1 sm:grid-cols-[auto_1fr] sm:gap-x-3">
                <h4 className="px-1.5 pb-0.5 text-xs uppercase tracking-wider text-muted sm:col-span-2">{dict.kindGroups[g.id]}</h4>
                {g.kinds.map((k) => (
                  <button
                    key={k}
                    type="button"
                    disabled={k === kind}
                    onClick={() => {
                      setOpen(false);
                      onChange(k);
                    }}
                    className="flex w-full flex-col rounded-md px-1.5 py-1.5 text-left text-sm hover:bg-accent-soft disabled:opacity-50 disabled:hover:bg-transparent sm:col-span-2 sm:grid sm:grid-cols-subgrid"
                  >
                    <span className="font-mono text-xs text-accent sm:text-sm">{dict.kinds[k].designation}</span>
                    <span className="leading-tight">{dict.kinds[k].name}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
