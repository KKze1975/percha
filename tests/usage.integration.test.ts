import { describe, it, expect, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { putClosetItem, CLOSET_TABLE } from "@/lib/dynamodb";
import { confirmOutfit } from "@/lib/outfit";
import { getUsageStats } from "@/lib/usage";
import type { ClosetItem } from "@/types/closet";

const infraReady = Boolean(process.env.AWS_REGION);

// 3.6: el porcentaje mostrado debe coincidir matematicamente con una consulta
// directa a DynamoDB tras una secuencia de outfits confirmados (que son los
// que disparan ADD uses :incr).
describe.skipIf(!infraReady)("3.6 medidor de uso real del closet", () => {
  const userId = `test-usage-${randomUUID()}`;

  const items: ClosetItem[] = Array.from({ length: 5 }, (_, i) => ({
    userId,
    itemId: randomUUID(),
    category: i % 2 === 0 ? "top" : "bottom",
    color: "azul",
    warmth: "mild",
    style: "casual",
    uses: 0,
    driveFileId: `fixture-${i}`,
    createdAt: new Date().toISOString(),
  }));

  afterAll(async () => {
    const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));
    await Promise.all(
      items.map((item) =>
        ddb.send(new DeleteCommand({ TableName: CLOSET_TABLE, Key: { userId, itemId: item.itemId } })),
      ),
    );
  });

  it("el porcentaje coincide con una consulta directa a DynamoDB tras confirmar outfits", async () => {
    await Promise.all(items.map((item) => putClosetItem(item)));

    // Simulate a sequence of confirmed outfits: 3 of the 5 items get used.
    await confirmOutfit(userId, [items[0].itemId]);
    await confirmOutfit(userId, [items[1].itemId]);
    await confirmOutfit(userId, [items[2].itemId]);

    const stats = await getUsageStats(userId);

    const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));
    const direct = await ddb.send(
      new QueryCommand({
        TableName: CLOSET_TABLE,
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: { ":userId": userId },
      }),
    );
    const directItems = (direct.Items ?? []) as ClosetItem[];
    const directUsedCount = directItems.filter((i) => i.uses > 0).length;
    const directPercentage = Math.round((directUsedCount / directItems.length) * 100);

    expect(stats.total).toBe(directItems.length);
    expect(stats.usedCount).toBe(directUsedCount);
    expect(stats.percentage).toBe(directPercentage);
    expect(stats.usedCount).toBe(3);
    expect(stats.percentage).toBe(60);
  });
});
