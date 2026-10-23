import { useState } from "react";
import type { FormRow } from "@/lib/form/fields";
import { sketchesOpenByDefault } from "@/lib/form/sample-rows";

/** View state only: per card, whether its sketches are open and whether it is folded to a tile; new rows follow the defaults. */
export function useCardView(rows: FormRow[]) {
  const [sketches, setSketches] = useState<Record<number, boolean>>({});
  const [folded, setFolded] = useState<Record<number, boolean>>({});
  const [sketchDefault, setSketchDefault] = useState(sketchesOpenByDefault);
  const sketchOpen = (id: number) => sketches[id] ?? sketchDefault;
  const isFolded = (id: number) => folded[id] ?? false;

  return {
    sketchOpen,
    isFolded,
    allSketchesOpen: rows.every((r) => sketchOpen(r.id)),
    allFolded: rows.length > 0 && rows.every((r) => isFolded(r.id)),
    toggleSketch: (id: number) => setSketches((s) => ({ ...s, [id]: !sketchOpen(id) })),
    toggleFolded: (id: number) => setFolded((f) => ({ ...f, [id]: !isFolded(id) })),
    setFoldedMany: (ids: number[], value: boolean) => setFolded((f) => ({ ...f, ...Object.fromEntries(ids.map((id) => [id, value])) })),
    setAllSketches: (open: boolean) => {
      setSketchDefault(open);
      setSketches(Object.fromEntries(rows.map((r) => [r.id, open])));
    },
    setAllFolded: (value: boolean) => setFolded(Object.fromEntries(rows.map((r) => [r.id, value]))),
  };
}

export type CardView = ReturnType<typeof useCardView>;
