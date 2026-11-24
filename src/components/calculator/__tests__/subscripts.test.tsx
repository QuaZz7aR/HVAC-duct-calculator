import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { subs } from "../subscripts";

const html = (t: string) => renderToStaticMarkup(<>{subs(t)}</>);

describe("subs", () => {
  it("writes the index digits as <sub>", () => {
    expect(html("Діаметр d₁, мм")).toBe("Діаметр d<sub>1</sub>, мм");
    expect(html("a₁×b₁ 400×200 · d₂ 250")).toBe("a<sub>1</sub>×b<sub>1</sub> 400×200 · d<sub>2</sub> 250");
    expect(html("x₁₂")).toBe("x<sub>12</sub>");
  });
  it("leaves text without indices as it is", () => {
    expect(html("Довжина L, мм")).toBe("Довжина L, мм");
    expect(subs("L")).toBe("L");
  });
});
