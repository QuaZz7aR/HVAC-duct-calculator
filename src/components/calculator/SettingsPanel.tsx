import { defaultConfig } from "@/lib/calc/config";
import type { FormIssue } from "@/lib/form/messages";
import { sheetKey, type SettingsText, type ThicknessTableKey } from "@/lib/form/settings";
import { useI18n } from "@/components/i18n";
import { ErrorList } from "./ErrorList";
import { cardClass, selectClass, labelClass, mutedClass } from "./styles";
import { Info } from "./Info";
import { TextField } from "./TextField";

interface FieldProps {
  settings: SettingsText;
  onChange: (settings: SettingsText) => void;
}

interface Props extends FieldProps {
  issues: FormIssue[];
}

/** Thickness table select; shared by the settings panel and the sheet list (ADR 0053). */
export function ThicknessTableField({ settings, onChange }: FieldProps) {
  const { dict } = useI18n();
  return (
    <label className="flex flex-col">
      <span className={labelClass}>{dict.settings.thicknessTable}<Info text={dict.help.settings.thicknessTable} /></span>
      <select
        className={`mt-auto ${selectClass}`}
        value={settings.thicknessTable}
        onChange={(e) => onChange({ ...settings, thicknessTable: e.target.value as ThicknessTableKey })}
      >
        <option value="dbn" className="bg-panel text-foreground">{dict.settings.thicknessDbn}</option>
        <option value="engineer" className="bg-panel text-foreground">{dict.settings.thicknessEngineer}</option>
      </select>
    </label>
  );
}

/** Sheet size select; shared by the settings panel and the sheet list (ADR 0053). */
export function SheetField({ settings, onChange }: FieldProps) {
  const { dict } = useI18n();
  return (
    <label className="flex flex-col">
      <span className={labelClass}>{dict.settings.sheet}<Info text={dict.help.settings.sheet} /></span>
      <select className={`mt-auto ${selectClass}`} value={settings.sheet} onChange={(e) => onChange({ ...settings, sheet: e.target.value })}>
        {defaultConfig.order.sheetSizes.map((s) => (
          <option key={sheetKey(s)} value={sheetKey(s)} className="bg-panel text-foreground">{s.widthMm} × {s.heightMm}</option>
        ))}
      </select>
    </label>
  );
}

/** Seam allowance and order margin inputs; shared by the settings panel and the totals (ADR 0053). */
export function SeamField({ settings, onChange }: FieldProps) {
  const { dict } = useI18n();
  return <TextField label={dict.settings.seamPercent} info={dict.help.settings.seamPercent} value={settings.seamPercent} onChange={(seamPercent) => onChange({ ...settings, seamPercent })} />;
}

export function MarginField({ settings, onChange }: FieldProps) {
  const { dict } = useI18n();
  return <TextField label={dict.settings.marginPercent} info={dict.help.settings.marginPercent} value={settings.marginPercent} onChange={(marginPercent) => onChange({ ...settings, marginPercent })} />;
}

/** Calculation settings: thickness table, seam allowance, order margin and sheet size. */
export function SettingsPanel({ settings, onChange, issues }: Props) {
  const { dict } = useI18n();
  return (
    <section className={cardClass} aria-labelledby="settings-title">
      <h2 id="settings-title" className="mb-3 font-medium">{dict.settings.title}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ThicknessTableField settings={settings} onChange={onChange} />
        <SeamField settings={settings} onChange={onChange} />
        <MarginField settings={settings} onChange={onChange} />
        <SheetField settings={settings} onChange={onChange} />
      </div>
      <p className={`mt-2 text-xs ${mutedClass}`}>{dict.settings.note}</p>
      <ErrorList issues={issues} />
    </section>
  );
}
