import type { ReactNode } from "react";
import { useI18n } from "@/components/i18n";
import { ColumnsIcon, FoldIcon, SketchesIcon } from "./ViewIcons";
import { buttonClass } from "./styles";
import type { CardView } from "./useCardView";

const action = `${buttonClass} inline-flex items-center gap-1.5`;

/** Desktop: the view toggles in a sticky bar above the list (ADR 0088); the phone keeps its round buttons. */
export function ViewBar({ view, twoColumns = false, onColumns, children }: { view: CardView; twoColumns?: boolean; onColumns?: (two: boolean) => void; children?: ReactNode }) {
  const { dict } = useI18n();
  return (
    <div role="group" aria-label={dict.palette.viewTitle} className="sticky top-4 z-20 hidden flex-wrap items-center gap-2 rounded-lg border-2 border-accent/60 bg-accent-soft px-3 py-3 shadow-xl shadow-black/40 lg:flex">
      <button type="button" onClick={() => view.setAllSketches(!view.allSketchesOpen)} className={action}>
        <SketchesIcon crossed={view.allSketchesOpen} className="h-4 w-6 text-accent" />
        {view.allSketchesOpen ? dict.hideAllSketches : dict.showAllSketches}
      </button>
      <button type="button" onClick={() => view.setAllFolded(!view.allFolded)} className={action}>
        <FoldIcon folded={view.allFolded} className="h-4 w-6 text-accent" />
        {view.allFolded ? dict.palette.expandCards : dict.palette.collapseCards}
      </button>
      {onColumns && (
        <button type="button" onClick={() => onColumns(!twoColumns)} aria-pressed={twoColumns} className={`${action} hidden xl:inline-flex`}>
          <ColumnsIcon two={!twoColumns} className="h-4 w-6 text-accent" />
          {twoColumns ? dict.palette.oneColumn : dict.palette.twoColumns}
        </button>
      )}
      {children}
    </div>
  );
}
