"use client";
import { useState } from "react";

import { I18nProvider, useI18n } from "@/components/i18n";
import { LangSwitch } from "./calculator/LangSwitch";
import { HelpButton } from "./calculator/HelpDialog";
import { FittingList } from "./calculator/FittingList";
import { SettingsPanel } from "./calculator/SettingsPanel";
import { ResultsTable } from "./calculator/ResultsTable";
import { SheetList } from "./calculator/SheetList";
import { InsulationList } from "./calculator/InsulationList";
import { KindRail } from "./calculator/KindPalette";
import { mutedClass } from "./calculator/styles";
import { Totals } from "./calculator/Totals";
import { PhoneActions } from "./calculator/PhoneActions";
import { useCalculator } from "./calculator/useCalculator";
import { useCardView } from "./calculator/useCardView";

export function Calculator() {
  return (
    <I18nProvider>
      <CalculatorPage />
    </I18nProvider>
  );
}

function CalculatorPage() {
  const { dict } = useI18n();
  const { rows, settings, setSettings, settingsIssues, calc, outcome, update, setKind, setValue, resetValue, addRow, countOf, lastAddedId, cloneRow, removeRow, moveRow, dropRows, prices, costs, setMetalPrice, setInsulationPrice } = useCalculator();

  const view = useCardView(rows);
  const [twoColumns, setTwoColumns] = useState(false);

  return (
    <div className="mx-auto w-full max-w-[120rem] flex-1 gap-6 px-4 py-8 xl:px-8 lg:grid lg:grid-cols-[8.5rem_minmax(0,1fr)]">
      <KindRail count={countOf} onAdd={addRow} view={view} hasRows={rows.length > 0} twoColumns={twoColumns} onColumns={setTwoColumns} />
      <main className="min-w-0 space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{dict.appTitle}</h1>
            <p className={`mt-1 text-sm ${mutedClass}`}>{dict.appSubtitle}</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end lg:hidden">
            <HelpButton />
            <LangSwitch />
          </div>
        </header>

        <SettingsPanel settings={settings} onChange={setSettings} issues={settingsIssues} />
        <FittingList
          rows={rows}
          view={view}
          twoColumns={twoColumns}
          lastAddedId={lastAddedId}
          outcome={outcome}
          onKindChange={setKind}
          onValueChange={setValue}
          onReset={resetValue}
          onPatch={update}
          onClone={cloneRow}
          onRemove={removeRow}
          onMove={moveRow}
          onDrop={dropRows}
        />
        <ResultsTable rows={rows} outcome={outcome} calc={calc} />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Totals calc={calc} pricing={costs} priceIssues={costs.issues} settings={settings} onSettings={setSettings} />
          <SheetList groups={calc.sheetList} prices={prices.metal} costs={costs.metal} onPrice={setMetalPrice} settings={settings} onSettings={setSettings} />
          <InsulationList groups={calc.insulationList} prices={prices.insulation} costs={costs.insulation} onPrice={setInsulationPrice} />
        </div>

        <footer className="text-xs text-muted">{dict.footer}</footer>
      </main>
      <PhoneActions view={view} hasRows={rows.length > 0} count={countOf} onAdd={addRow} />
    </div>
  );
}
