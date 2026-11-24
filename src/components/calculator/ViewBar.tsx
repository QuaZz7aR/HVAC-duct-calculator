import type { ReactNode } from "react";
import { useI18n } from "@/components/i18n";
import { ColumnsIcon, FoldIcon, SketchesIcon } from "./ViewIcons";
import { buttonClass } from "./styles";
import type { CardView } from "./useCardView";

const action = `${buttonClass} inline-flex items-center gap-1.5`;

/**
 * Desktop: the view toggles in a sticky bar above the list (ADR 0088); the phone keeps its round buttons.
 * A framed tile as tall as the rail's «+ Додати деталь» block, level with it; the strip above it is painted
 * in the page colour, so the cards scroll away under it instead of showing through the gap.
 */
export function ViewBar({ view, twoColumns = false, onColumns, children }: { view: CardView; twoColumns?: boolean; onColumns?: (two: boolean) => void; children?: ReactNode }) {
  const { dict } = useI18n();
  return (
    <div className="sticky top-0 z-20 -mt-4 hidden bg-background pt-4 lg:block">
      <div role="group" aria-label={dict.palette.viewTitle} className="flex min-h-[68px] flex-wrap items-center gap-2 rounded-lg py-2 border-2 border-accent/60 bg-bar px-3 shadow-xl shadow-black/40">
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
    </div>
  );
}
