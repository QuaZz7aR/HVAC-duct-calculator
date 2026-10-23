/** Back to the top of the page (instant for people who asked for less motion). */
export function scrollToTop() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
}

/** Scrolls to the fittings list, e.g. after folding all cards so the page does not end up in empty space. */
export function scrollToList() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  requestAnimationFrame(() => document.getElementById("items")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }));
}
