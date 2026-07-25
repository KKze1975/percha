import { describe, it, expect, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { OUTFIT_LOG_TABLE } from "@/lib/dynamodb";
import { confirmOutfit } from "@/lib/outfit";
import { getOutfitLogRange } from "@/lib/dynamodb";

const infraReady = Boolean(process.env.AWS_REGION);

// PRD-ADDENDUM section 1: confirming an outfit must write the same day into
// OutfitLog (fed by the same event that already increments `uses`, not a
// separate flow), and a date-range query must return every registered day
// without loss.
describe.skipIf(!infraReady)("addendum 1: calendario de outfits", () => {
  const userId = `test-calendar-${randomUUID()}`;
  const dates = ["2026-07-01", "2026-07-15", "2026-07-31"];

  afterAll(async () => {
    const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));
    await Promise.all(
      dates.map((date) => ddb.send(new DeleteCommand({ TableName: OUTFIT_LOG_TABLE, Key: { userId, date } }))),
    );
  });

  it("confirmar un outfit lo hace consultable en OutfitLog con los itemIds correctos", async () => {
    const itemIds = [randomUUID(), randomUUID()];
    await confirmOutfit(userId, itemIds, dates[0]);

    const entries = await getOutfitLogRange(userId, dates[0], dates[0]);
    expect(entries).toHaveLength(1);
    expect(entries[0].itemIds).toEqual(itemIds);
  });

  it("una consulta por rango de mes completo devuelve todos los dias sin perdida", async () => {
    await Promise.all(dates.map((date) => confirmOutfit(userId, [randomUUID()], date)));

    const entries = await getOutfitLogRange(userId, "2026-07-01", "2026-07-31");
    const returnedDates = entries.map((e) => e.date).sort();
    expect(returnedDates).toEqual([...dates].sort());
  });
});
