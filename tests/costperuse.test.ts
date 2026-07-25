import { describe, it, expect } from "vitest";
import { computeCostPerUse } from "@/lib/costPerUse";
import type { ClosetItem } from "@/types/closet";

function fixture(overrides: Partial<ClosetItem>): ClosetItem {
  return {
    userId: "u1",
    itemId: overrides.itemId ?? "item",
    category: "top",
    color: "azul",
    warmth: "mild",
    style: "casual",
    uses: 0,
    driveFileId: "d1",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

// PRD-ADDENDUM section 2: costPerUse = price / uses, sorted descending
// (most expensive per use first). Items without a price don't appear.
describe("addendum 2: costo-por-uso", () => {
  it("calcula precio/usos y ordena descendente entre 3 prendas conocidas", () => {
    const items = [
      fixture({ itemId: "cheap", price: 20, uses: 10 }), // 2
      fixture({ itemId: "expensive", price: 300, uses: 2 }), // 150
      fixture({ itemId: "mid", price: 60, uses: 4 }), // 15
    ];

    const entries = computeCostPerUse(items);

    expect(entries.map((e) => e.item.itemId)).toEqual(["expensive", "mid", "cheap"]);
    expect(entries.map((e) => e.costPerUse)).toEqual([150, 15, 2]);
  });

  it("excluye prendas sin precio de la vista", () => {
    const items = [fixture({ itemId: "priced", price: 40, uses: 2 }), fixture({ itemId: "unpriced" })];
    const entries = computeCostPerUse(items);
    expect(entries.map((e) => e.item.itemId)).toEqual(["priced"]);
  });

  it("una prenda con precio y uses:0 ordena primero como el caso mas caro por uso", () => {
    const items = [
      fixture({ itemId: "worn", price: 50, uses: 5 }),
      fixture({ itemId: "unworn", price: 50, uses: 0 }),
    ];
    const entries = computeCostPerUse(items);
    expect(entries[0].item.itemId).toBe("unworn");
    expect(entries[0].costPerUse).toBe(Infinity);
  });
});
