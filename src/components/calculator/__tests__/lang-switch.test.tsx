import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { I18nContext, I18nProvider } from "@/components/i18n";
import { dictionaries } from "@/lib/i18n";
import { LangSwitch } from "../LangSwitch";
import { ResultsTable } from "../ResultsTable";
import type { Calculation } from "@/lib/form/calculate";

describe("LangSwitch", () => {
  it("renders Ukrainian first, before the stored choice is read", () => {
    const html = renderToStaticMarkup(<I18nProvider><LangSwitch /></I18nProvider>);
    expect(html).toMatch(/lang="uk"[^>]*aria-pressed="true"|aria-pressed="true"[^>]*lang="uk"/);
    expect(html).toContain("EN");
  });

  it("components take their text from the chosen language", () => {
    const value = { lang: "en" as const, dict: dictionaries.en, fmt: (n: number) => String(n), setLang: () => {} };
    const calc = { rows: [], sheetList: [], skipped: 0 } as unknown as Calculation;
    const html = renderToStaticMarkup(
      <I18nContext.Provider value={value}>
        <LangSwitch />
        <ResultsTable rows={[]} outcome={() => undefined} calc={calc} />
      </I18nContext.Provider>,
    );
    expect(html).toContain(dictionaries.en.results.title);
    expect(html).not.toContain(dictionaries.uk.results.title);
    expect(html).toMatch(/lang="en"[^>]*aria-pressed="true"|aria-pressed="true"[^>]*lang="en"/);
  });
});
