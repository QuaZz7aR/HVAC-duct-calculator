/** How long the card stays outlined after the scroll ends, ms (ADR 0054). */
export const highlightMs = 1500;

/** Scrolls to a fitting card and outlines it for `highlightMs` once the scroll has stopped. */
export function scrollToCard(id: number | string) {
  scrollAndHighlight(`fitting-${id}`);
}

/** The same for a whole section of the list (its frame and title, ADR 0057). */
export function scrollToSection(firstRowId: number | string) {
  scrollAndHighlight(`section-${firstRowId}`);
}

function scrollAndHighlight(elementId: string) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let done = false;
  const highlight = () => {
    if (done) return;
    done = true;
    window.removeEventListener("scrollend", highlight);
    el.classList.add("highlight-fade", "highlight-card");
    window.setTimeout(() => el.classList.remove("highlight-card"), highlightMs);
    window.setTimeout(() => el.classList.remove("highlight-fade"), highlightMs + 700);
  };
  window.addEventListener("scrollend", highlight, { once: true });
  // No scroll needed, or no scrollend support: fall back to a timer.
  window.setTimeout(highlight, reduce ? 0 : 1000);
  el.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
}
