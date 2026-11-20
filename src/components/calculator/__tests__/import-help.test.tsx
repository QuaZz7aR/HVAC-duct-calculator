import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { en } from "@/lib/i18n/en";
import { uk } from "@/lib/i18n/uk";
import { I18nProvider } from "@/components/i18n";
import { ImportButton } from "../ImportDialog";

describe("import dialog help (ADR 0063)", () => {
  it("has the same «i» texts in both languages, none empty", () => {
    expect(Object.keys(en.import.info).sort()).toEqual(Object.keys(uk.import.info).sort());
    for (const t of [...Object.values(uk.import.info), ...Object.values(en.import.info)]) expect(t.trim()).not.toBe("");
  });

  it("shows an «i» button next to the file intro before a file is chosen", () => {
    const html = renderToStaticMarkup(<I18nProvider><ImportButton onImport={() => 0} /></I18nProvider>);
    expect(html).toContain(uk.help.info);
  });
});
