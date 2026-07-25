import { describe, it, expect } from "vitest";
import { getAvatarParts } from "@/lib/avatarParts";
import { colorToHex } from "@/lib/colorMap";
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

// 3.4: snapshot of a known outfit confirming the expected color per category.
describe("3.4 avatar simplificado: colores por categoria", () => {
  it("mapea cada prenda conocida al color esperado por categoria", () => {
    const outfit: ClosetItem[] = [
      fixture({ itemId: "top-1", category: "top", color: "azul" }),
      fixture({ itemId: "bottom-1", category: "bottom", color: "negro" }),
      fixture({ itemId: "shoes-1", category: "shoes", color: "blanco" }),
    ];

    const parts = getAvatarParts(outfit);

    expect(parts).toEqual([
      { slot: "bottom", fill: colorToHex("negro"), itemId: "bottom-1" },
      { slot: "top", fill: colorToHex("azul"), itemId: "top-1" },
      { slot: "shoes", fill: colorToHex("blanco"), itemId: "shoes-1" },
    ]);
    expect(colorToHex("azul")).toBe("#2563eb");
    expect(colorToHex("negro")).toBe("#1f2937");
    expect(colorToHex("blanco")).toBe("#f9fafb");
  });

  it("un color desconocido cae a un gris neutro en vez de romper", () => {
    const outfit: ClosetItem[] = [fixture({ itemId: "top-2", category: "top", color: "turquesa-fluor" })];
    const parts = getAvatarParts(outfit);
    expect(parts).toEqual([{ slot: "top", fill: "#9ca3af", itemId: "top-2" }]);
  });

  it("dress reemplaza top+bottom en vez de convivir con ellos", () => {
    const outfit: ClosetItem[] = [
      fixture({ itemId: "dress-1", category: "dress", color: "rojo" }),
      fixture({ itemId: "shoes-1", category: "shoes", color: "negro" }),
    ];
    const parts = getAvatarParts(outfit);
    expect(parts.map((p) => p.slot)).toEqual(["dress", "shoes"]);
  });
});
