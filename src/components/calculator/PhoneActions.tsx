import { useEffect, useRef, useState } from "react";
import type { FittingKind } from "@/lib/form/fields";
import { quickKinds, searchKinds } from "@/lib/form/kind-groups";
import { uk as dict } from "@/lib/i18n/uk";
import { Sheet } from "./KindPalette";
import type { CardView } from "./useCardView";
import { scrollToTop } from "./scrollToTop";
import { useDismiss } from "./useDismiss";
import { FoldIcon, SketchesIcon, UpIcon } from "./ViewIcons";

const round =
  "grid h-11 w-11 place-items-center rounded-full border border-line bg-panel text-accent shadow-lg shadow-black/30 hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-accent";

interface Props {
  view: CardView;
  hasRows: boolean;
  /** how many rows of the kind the list already has */
  count: (kind: FittingKind) => number;
  onAdd: (kind: FittingKind) => void;
}

/** Phone: a column of small round buttons at the right edge, within reach of a thumb. Closed: the two view toggles, "to top" after a short scroll down, and "+". Opened by "+": the quick kinds and "..." (the sheet with every kind and a search). */
export function PhoneActions({ view, hasRows, count, onAdd }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, open && !sheet, () => setOpen(false));
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 300);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const closeSheet = () => {
    setSheet(false);
    setQuery("");
    setOpen(false);
  };
  const sketches = view.allSketchesOpen ? dict.hideAllSketches : dict.showAllSketches;
  const folding = view.allFolded ? dict.palette.expandCards : dict.palette.collapseCards;
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" aria-hidden="true" />}
      <div
        ref={ref}
        className="fixed z-30 flex flex-col gap-2 lg:hidden"
        style={{ right: "max(1rem, env(safe-area-inset-right, 0px))", bottom: "max(1rem, env(safe-area-inset-bottom, 0px))" }}
      >
        {open ? (
          <div role="toolbar" aria-label={dict.palette.title} className="flex flex-col gap-2">
            <button type="button" onClick={() => setSheet(true)} aria-haspopup="dialog" aria-label={dict.palette.allKinds} title={dict.palette.allKinds} className={`${round} text-lg font-bold leading-none`}>
              ⋯
            </button>
            {[...quickKinds].reverse().map((kind) => (
              <button key={kind} type="button" onClick={() => { onAdd(kind); setOpen(false); }} aria-label={dict.kinds[kind].name} title={dict.kinds[kind].name} className={`${round} font-mono text-[13px] font-semibold`}>
                {dict.kinds[kind].designation}
              </button>
            ))}
          </div>
        ) : (
          <>
            {hasRows && (
              <>
                <button type="button" onClick={() => view.setAllSketches(!view.allSketchesOpen)} aria-label={sketches} title={sketches} className={round}>
                  <SketchesIcon crossed={view.allSketchesOpen} className="h-5 w-7" />
                </button>
                <button type="button" onClick={() => view.setAllFolded(!view.allFolded)} aria-label={folding} title={folding} className={round}>
                  <FoldIcon folded={view.allFolded} className="h-5 w-7" />
                </button>
              </>
            )}
            {scrolled && (
              <button type="button" onClick={scrollToTop} aria-label={dict.palette.toTop} title={dict.palette.toTop} className={round}>
                <UpIcon className="h-5 w-7" />
              </button>
            )}
          </>
        )}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label={open ? dict.palette.closeMenu : dict.palette.addButton}
          title={open ? dict.palette.closeMenu : dict.palette.addButton}
          className="grid h-11 w-11 place-items-center self-end rounded-full bg-accent text-2xl font-light leading-none text-background shadow-lg shadow-black/30 focus-visible:outline-2 focus-visible:outline-accent"
        >
          {open ? "×" : "+"}
        </button>
      </div>
      {sheet && <Sheet found={searchKinds(query)} query={query} setQuery={setQuery} count={count} onClose={closeSheet} onAdd={(k) => { onAdd(k); closeSheet(); }} />}
    </>
  );
}
