"use client";

import { uk as dict } from "@/lib/i18n/uk";
import { FittingList } from "./calculator/FittingList";
import { SettingsPanel } from "./calculator/SettingsPanel";
import { ResultsTable } from "./calculator/ResultsTable";
import { SheetList } from "./calculator/SheetList";
import { KindQuickBar, KindRail } from "./calculator/KindPalette";
import { mutedClass } from "./calculator/styles";
import { Totals } from "./calculator/Totals";
import { useCalculator } from "./calculator/useCalculator";
import { useCardView } from "./calculator/useCardView";

export function Calculator() {
  const { rows, settings, setSettings, settingsIssues, calc, outcome, update, setKind, setValue, resetValue, addRow, countOf, lastAddedId, cloneRow, removeRow } = useCalculator();

  const view = useCardView(rows);

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 gap-6 px-4 py-8 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      <KindRail count={countOf} onAdd={addRow} view={view} hasRows={rows.length > 0} />
      <main className="min-w-0 space-y-6">
        <header>
          <h1 className="text-2xl font-semibold">{dict.appTitle}</h1>
          <p className={`mt-1 text-sm ${mutedClass}`}>{dict.appSubtitle}</p>
        </header>

        <SettingsPanel settings={settings} onChange={setSettings} issues={settingsIssues} />
        <KindQuickBar count={countOf} onAdd={addRow} />
        <FittingList
          rows={rows}
          view={view}
          lastAddedId={lastAddedId}
          outcome={outcome}
          onKindChange={setKind}
          onValueChange={setValue}
          onReset={resetValue}
          onPatch={update}
          onClone={cloneRow}
          onRemove={removeRow}
        />
        <ResultsTable rows={rows} outcome={outcome} calc={calc} />

        <div className="grid gap-6 md:grid-cols-2">
          <Totals calc={calc} />
          <SheetList groups={calc.sheetList} />
        </div>

        <footer className="text-xs text-muted">{dict.footer}</footer>
      </main>
    </div>
  );
}
