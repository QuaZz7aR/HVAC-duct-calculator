import { useEffect, useState } from "react";
import { uk as dict } from "@/lib/i18n/uk";
import { scrollToTop } from "./scrollToTop";
import { UpIcon } from "./ViewIcons";

/** Phone: a small round button in the bottom right corner that appears after a short scroll down. */
export function ScrollTopButton() {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > 300);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!shown) return null;
  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label={dict.palette.toTop}
      title={dict.palette.toTop}
      className="fixed z-30 grid h-11 w-11 place-items-center rounded-full border border-line bg-panel text-accent shadow-lg shadow-black/30 hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-accent lg:hidden"
      style={{ right: "max(1rem, env(safe-area-inset-right, 0px))", bottom: "max(1rem, env(safe-area-inset-bottom, 0px))" }}
    >
      <UpIcon className="h-5 w-7" />
    </button>
  );
}
