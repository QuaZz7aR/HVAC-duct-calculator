import { defaultConfig } from "@/lib/calc/config";
import type { FormIssue } from "@/lib/form/messages";
import { sheetKey, type SettingsText, type ThicknessTableKey } from "@/lib/form/settings";
import { uk as dict } from "@/lib/i18n/uk";
import { ErrorList } from "./ErrorList";
import { cardClass, inputClass, labelClass, mutedClass } from "./styles";
import { TextField } from "./TextField";

interface Props {
  settings: SettingsText;
  onChange: (settings: SettingsText) => void;
  issues: FormIssue[];
}

/** Calculation settings: thickness table, seam allowance, order margin and sheet size. */
export function SettingsPanel({ settings, onChange, issues }: Props) {
  return (
    <section className={cardClass} aria-labelledby="settings-title">
      <h2 id="settings-title" className="mb-3 font-medium">{dict.settings.title}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label>
          <span className={labelClass}>{dict.settings.thicknessTable}</span>
          <select
            className={inputClass}
            value={settings.thicknessTable}
            onChange={(e) => onChange({ ...settings, thicknessTable: e.target.value as ThicknessTableKey })}
          >
            <option value="dbn" className="text-black">{dict.settings.thicknessDbn}</option>
            <option value="engineer" className="text-black">{dict.settings.thicknessEngineer}</option>
          </select>
        </label>
        <TextField label={dict.settings.seamPercent} value={settings.seamPercent} onChange={(seamPercent) => onChange({ ...settings, seamPercent })} />
        <TextField label={dict.settings.marginPercent} value={settings.marginPercent} onChange={(marginPercent) => onChange({ ...settings, marginPercent })} />
        <label>
          <span className={labelClass}>{dict.settings.sheet}</span>
          <select className={inputClass} value={settings.sheet} onChange={(e) => onChange({ ...settings, sheet: e.target.value })}>
            {defaultConfig.order.sheetSizes.map((s) => (
              <option key={sheetKey(s)} value={sheetKey(s)} className="text-black">{s.widthMm} × {s.heightMm}</option>
            ))}
          </select>
        </label>
      </div>
      <p className={`mt-2 text-xs ${mutedClass}`}>{dict.settings.note}</p>
      <ErrorList issues={issues} />
    </section>
  );
}
