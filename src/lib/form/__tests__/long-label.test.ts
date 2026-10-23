import { describe, expect, it } from "vitest";
import { isLongLabel } from "../layout";

describe("isLongLabel", () => {
  it("keeps short labels in half a card", () => {
    expect(isLongLabel("Ширина, мм")).toBe(false);
    expect(isLongLabel("Кількість, шт")).toBe(false);
  });

  it("gives a long label, with its note or action, the full width", () => {
    expect(isLongLabel("Внутрішній радіус, мм (авто)")).toBe(true);
    expect(isLongLabel("Радіус по осі, мм скинути до авто")).toBe(true);
  });
});
