import { describe, expect, it } from "vitest";
import { kindOrder } from "../fields";
import { insertIndex, kindGroups, quickKinds, searchKinds } from "../kind-groups";

describe("kind groups", () => {
  it("list every kind exactly once, in the order of kindOrder", () => {
    expect(kindGroups.flatMap((g) => g.kinds)).toEqual(kindOrder);
  });

  it("offer quick kinds that exist", () => {
    for (const k of quickKinds) expect(kindOrder).toContain(k);
  });
});

describe("insertIndex", () => {
  const rows = [{ kind: "roundStraight" }, { kind: "roundElbow" }, { kind: "roundStraight" }, { kind: "rectTee" }] as const;

  it("goes after the last row of the same kind", () => {
    expect(insertIndex(rows, "roundStraight")).toBe(3);
    expect(insertIndex(rows, "roundElbow")).toBe(2);
  });

  it("goes to the end for a kind that is not in the list yet, and for an empty list", () => {
    expect(insertIndex(rows, "rectCap")).toBe(4);
    expect(insertIndex([], "rectCap")).toBe(0);
  });
});

describe("searchKinds", () => {
  it("returns all groups for an empty query", () => {
    expect(searchKinds("  ")).toEqual(kindGroups);
  });

  it("matches the designation and the name, ignoring case, and drops empty groups", () => {
    expect(searchKinds("квр").flatMap((g) => g.kinds)).toEqual(["roundTap"]);
    const tees = searchKinds("ТРІЙНИК");
    expect(tees.map((g) => g.id)).toEqual(["tee"]);
    expect(tees[0].kinds).toHaveLength(4);
    expect(searchKinds("zzz")).toEqual([]);
  });
});
