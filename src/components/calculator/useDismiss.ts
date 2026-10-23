import { useEffect, useRef, type RefObject } from "react";

/** Calls `close` on a press outside `ref` or on Escape, while `open`. */
export function useDismiss(ref: RefObject<HTMLElement | null>, open: boolean, close: () => void) {
  const closeRef = useRef(close);
  useEffect(() => {
    closeRef.current = close; // latest callback without re-subscribing on every render
  });
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) closeRef.current();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [ref, open]);
}
