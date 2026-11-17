import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { kindFields, kindOrder } from "@/lib/form/fields";
import { en } from "@/lib/i18n/en";
import { uk } from "@/lib/i18n/uk";
import { I18nProvider } from "@/components/i18n";
import { HelpButton } from "../HelpDialog";
import { Info } from "../Info";

describe("in-app help (ADR 0046)", () => {
  it("has the same explanations in both languages, none empty", () => {
    for (const part of ["fields", "settings", "columns"] as const) {
      expect(Object.keys(en.help[part]).sort()).toEqual(Object.keys(uk.help[part]).sort());
      for (const t of [...Object.values(uk.help[part]), ...Object.values(en.help[part])]) expect(t.trim()).not.toBe("");
    }
    expect(en.help.guide.steps).toHaveLength(uk.help.guide.steps.length);
  });

  it("explains only fields that exist", () => {
    const keys = new Set<string>(kindOrder.flatMap((k) => kindFields[k].map((f) => f.key)));
    for (const k of ["allowanceCount", "quantity", "insulation"]) keys.add(k);
    for (const k of Object.keys(uk.help.fields)) expect(keys.has(k)).toBe(true);
  });

  it("renders a closed «i» button and the help button", () => {
    const info = renderToStaticMarkup(<I18nProvider><Info text="x" /></I18nProvider>);
    expect(info).toContain('aria-expanded="false"');
    expect(info).not.toContain('role="note"');
    const help = renderToStaticMarkup(<I18nProvider><HelpButton /></I18nProvider>);
    expect(help).toContain(uk.help.guide.button);
    for (const s of uk.help.guide.steps) expect(help).toContain(s.title);
  });
});
