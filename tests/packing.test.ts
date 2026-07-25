import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { putClosetItem, CLOSET_TABLE } from "@/lib/dynamodb";
import { generatePackingList, computeTripDays } from "@/lib/packing";
import type { ClosetItem } from "@/types/closet";

const infraReady = Boolean(process.env.AWS_REGION);

function fixture(userId: string, overrides: Partial<ClosetItem>): ClosetItem {
  return {
    userId,
    itemId: randomUUID(),
    category: "top",
    color: "azul",
    warmth: "mild",
    style: "casual",
    uses: 0,
    driveFileId: "fixture",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("addendum 5: planeacion de viajes (fechas)", () => {
  it("computeTripDays devuelve todos los dias inclusive", () => {
    expect(computeTripDays("2026-08-01", "2026-08-03")).toEqual([
      "2026-08-01",
      "2026-08-02",
      "2026-08-03",
    ]);
  });
});

// PRD-ADDENDUM section 5: a 3-day packing list produces 3 distinct combos
// (not the same one repeated), applying the same uses-ranking as the daily
// generator (reused via lib/outfit.ts's pickLowestUseCombo).
describe.skipIf(!infraReady)("addendum 5: planeacion de viajes (ranking real)", () => {
  const userId = `test-packing-${randomUUID()}`;
  let items: ClosetItem[] = [];

  beforeAll(async () => {
    items = [
      fixture(userId, { category: "top", uses: 0 }),
      fixture(userId, { category: "top", uses: 3 }),
      fixture(userId, { category: "top", uses: 6 }),
      fixture(userId, { category: "bottom", uses: 1 }),
      fixture(userId, { category: "bottom", uses: 4 }),
      fixture(userId, { category: "bottom", uses: 7 }),
      fixture(userId, { category: "shoes", uses: 2 }),
      fixture(userId, { category: "shoes", uses: 5 }),
      fixture(userId, { category: "shoes", uses: 8 }),
    ];
    await Promise.all(items.map((item) => putClosetItem(item)));
  });

  afterAll(async () => {
    const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));
    await Promise.all(
      items.map((item) =>
        ddb.send(new DeleteCommand({ TableName: CLOSET_TABLE, Key: { userId, itemId: item.itemId } })),
      ),
    );
  });

  it("una lista de 3 dias genera 3 combinaciones distintas priorizando menor uso", async () => {
    const result = await generatePackingList(userId, {
      destination: "Cartagena",
      startDate: "2026-08-01",
      endDate: "2026-08-03",
      activities: [],
      weather: "mild",
    });

    expect(result.days).toHaveLength(3);

    const idSets = result.days.map((day) => day.items.map((i) => i.itemId).sort().join(","));
    expect(new Set(idSets).size).toBe(3);

    const dayOneUses = result.days[0].items.map((i) => i.uses).sort((a, b) => a - b);
    expect(dayOneUses).toEqual([0, 1, 2]);
  });
});
