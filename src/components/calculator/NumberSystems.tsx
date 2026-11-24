"use client";

import { useState } from "react";
import { useI18n } from "@/components/i18n";
import type { FormRow } from "@/lib/form/fields";
import { numberBySystems, systemOf } from "@/lib/form/order";
import { Info } from "./Info";
import { buttonClass, inputClass } from "./styles";

type Scope = "all" | "empty";

/**
 * «Нумерація по системах» (ADR 0095): a button that opens an inline form (no browser dialog): the system for the rows
 * without one, all rows or only the empty positions, and a preview of the first positions before anything changes.
 */
export function NumberSystems({ rows, onNumber }: { rows: FormRow[]; onNumber: (system: string, scope: Scope) => void }) {
  const { dict } = useI18n();
  const t = dict.numbering;
  const [open, setOpen] = useState(false);
  const [system, setSystem] = useState("");
  const [scope, setScope] = useState<Scope>("empty");
  const toggle = (
      <button type="button" className={buttonClass} aria-expanded={open} onClick={() => { if (open) return setOpen(false); setSystem((s) => s || rows.map((r) => systemOf(r.position)).find(Boolean) || ""); setOpen(true); }}>
        {t.button}
      </button>
  );
  if (!open) return toggle;
  const preview = numberBySystems(rows, system, scope);
  const changed = preview.filter((r, i) => r.position !== rows[i].position);
  const sample = changed.slice(0, 4).map((r) => r.position).join(", ") + (changed.length > 4 ? ", …" : "");
  return (
    // a panel under the button, so the sticky view bar keeps its height
    <div className="relative">
      {toggle}
      <div role="group" aria-label={t.button} className="absolute left-0 top-full z-20 mt-2 flex w-[min(26rem,calc(100vw-2rem))] flex-col gap-2 rounded-md border border-line bg-panel p-3 shadow-lg">
      <label className="flex items-center gap-2 text-sm">
        {t.system}
        <input className={inputClass} value={system} placeholder="П1" onChange={(e) => setSystem(e.target.value)} />
      </label>
      <select className={`${inputClass} select-chevron`} aria-label={t.scopeLabel} value={scope} onChange={(e) => setScope(e.target.value as Scope)}>
        <option value="empty">{t.scope.empty}</option>
        <option value="all">{t.scope.all}</option>
      </select>
      <p className="text-sm text-muted" aria-live="polite">{changed.length ? t.preview(changed.length, sample) : t.nothing}<Info text={t.info} /></p>
      <div className="flex gap-2">
      <button type="button" className={buttonClass} disabled={!changed.length} onClick={() => { onNumber(system, scope); setOpen(false); }}>{t.apply}</button>
      <button type="button" className={buttonClass} onClick={() => setOpen(false)}>{t.cancel}</button>
      </div>
      </div>
    </div>
  );
}
