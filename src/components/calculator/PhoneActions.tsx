import { useEffect, useState } from "react";
import { uk as dict } from "@/lib/i18n/uk";
import type { CardView } from "./useCardView";
import { scrollToTop } from "./scrollToTop";
import { FoldIcon, SketchesIcon, UpIcon } from "./ViewIcons";

const round =
  "grid h-11 w-11 place-items-center rounded-full border border-line bg-panel text-accent shadow-lg shadow-black/30 hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-accent";

/** Phone: a column of small round buttons at the right edge, within reach of a thumb: the two view toggles, and "to top" after a short scroll down. */
export function PhoneActions({ view, hasRows }: { view: CardView; hasRows: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 300);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!hasRows && !scrolled) return null;
  const sketches = view.allSketchesOpen ? dict.hideAllSketches : dict.showAllSketches;
  const folding = view.allFolded ? dict.palette.expandCards : dict.palette.collapseCards;
  return (
    <div
      className="fixed z-30 flex flex-col gap-2 lg:hidden"
      style={{ right: "max(1rem, env(safe-area-inset-right, 0px))", bottom: "max(1rem, env(safe-area-inset-bottom, 0px))" }}
    >
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
    </div>
  );
}
