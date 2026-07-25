import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { putClosetItem, CLOSET_TABLE } from "@/lib/dynamodb";
import { generateOutfit, confirmOutfit } from "@/lib/outfit";
import type { ClosetItem } from "@/types/closet";

const infraReady = Boolean(process.env.AWS_REGION && process.env.ANTHROPIC_API_KEY);

// 3.3 — the most important verifiable criterion in the PRD: the ranking by
// `uses` must be real, not decorative in the prompt. Six real DynamoDB items
// (2 with uses:0, 4 with uses>=5), same weather/style so category choice is
// the only variable, run the real generator 5 times against the real Claude
// API, and confirm the uses:0 items win far more often than the ~50% random
// baseline implied by 2 options per category. Then confirms the ADD uses
// :incr update actually lands in DynamoDB after confirming an outfit.
describe.skipIf(!infraReady)("3.3 generador de outfit: ranking real por uso", () => {
  const userId = `test-outfit-${randomUUID()}`;

  const topLow: ClosetItem = {
    userId,
    itemId: randomUUID(),
    category: "top",
    color: "azul",
    warmth: "mild",
    style: "casual",
    uses: 0,
    driveFileId: "fixture-top-low",
    createdAt: new Date().toISOString(),
  };
  const bottomLow: ClosetItem = {
    userId,
    itemId: randomUUID(),
    category: "bottom",
    color: "gris",
    warmth: "mild",
    style: "casual",
    uses: 0,
    driveFileId: "fixture-bottom-low",
    createdAt: new Date().toISOString(),
  };
  const topHigh: ClosetItem = {
    userId,
    itemId: randomUUID(),
    category: "top",
    color: "rojo",
    warmth: "mild",
    style: "casual",
    uses: 6,
    driveFileId: "fixture-top-high",
    createdAt: new Date().toISOString(),
  };
  const bottomHigh: ClosetItem = {
    userId,
    itemId: randomUUID(),
    category: "bottom",
    color: "negro",
    warmth: "mild",
    style: "casual",
    uses: 7,
    driveFileId: "fixture-bottom-high",
    createdAt: new Date().toISOString(),
  };
  const shoesA: ClosetItem = {
    userId,
    itemId: randomUUID(),
    category: "shoes",
    color: "blanco",
    warmth: "mild",
    style: "casual",
    uses: 8,
    driveFileId: "fixture-shoes-a",
    createdAt: new Date().toISOString(),
  };
  const shoesB: ClosetItem = {
    userId,
    itemId: randomUUID(),
    category: "shoes",
    color: "cafe",
    warmth: "mild",
    style: "casual",
    uses: 9,
    driveFileId: "fixture-shoes-b",
    createdAt: new Date().toISOString(),
  };

  const allItems = [topLow, bottomLow, topHigh, bottomHigh, shoesA, shoesB];

  beforeAll(async () => {
    await Promise.all(allItems.map((item) => putClosetItem(item)));
  });

  afterAll(async () => {
    const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));
    await Promise.all(
      allItems.map((item) =>
        ddb.send(new DeleteCommand({ TableName: CLOSET_TABLE, Key: { userId, itemId: item.itemId } })),
      ),
    );
  });

  it("las prendas con uses:0 aparecen en proporcion claramente mayor al azar en 5 corridas", async () => {
    const RUNS = 5;
    let topLowCount = 0;
    let bottomLowCount = 0;

    for (let i = 0; i < RUNS; i++) {
      const outfit = await generateOutfit(userId, { weather: "mild", occasion: "casual" });
      const ids = outfit.items.map((item) => item.itemId);
      if (ids.includes(topLow.itemId)) topLowCount++;
      if (ids.includes(bottomLow.itemId)) bottomLowCount++;
    }

    // Random baseline per category is 1/2 (two competing items). "Claramente
    // mayor a lo esperado por azar" = at least 4/5 runs (80%) vs the 50% baseline.
    expect(topLowCount).toBeGreaterThanOrEqual(4);
    expect(bottomLowCount).toBeGreaterThanOrEqual(4);
  });

  it("confirmar un outfit ejecuta ADD uses :incr de verdad en DynamoDB", async () => {
    await confirmOutfit(userId, [topLow.itemId, bottomLow.itemId]);

    const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));
    const result = await ddb.send(
      new GetCommand({ TableName: CLOSET_TABLE, Key: { userId, itemId: topLow.itemId } }),
    );

    expect(result.Item?.uses).toBe(1);
  });
});
