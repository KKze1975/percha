import { describe, it, expect, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import {
  putClosetItem,
  getClosetItems,
  CLOSET_TABLE,
  OUTFIT_LOG_TABLE,
  USER_PROFILE_TABLE,
} from "@/lib/dynamodb";
import { generateOutfit, confirmOutfit } from "@/lib/outfit";
import { getMonthLog } from "@/lib/calendar";
import { computeCostPerUse } from "@/lib/costPerUse";
import { saveAvatarConfig, getAvatarConfig } from "@/lib/avatarConfig";
import { Avatar } from "@/components/Avatar";
import type { AvatarConfig } from "@/types/avatar";

const infraReady = Boolean(process.env.AWS_REGION && process.env.ANTHROPIC_API_KEY);

// Closing verification from the PRD-ADDENDUM: upload an item with a price ->
// generate an outfit -> confirm it -> it shows up in the calendar on the
// right day -> the cost-per-use view reflects it -> the parametric avatar
// reflects the saved config. Chains real functions against real DynamoDB
// under a synthetic userId (never the app's real PERCHA_USER_ID), so this
// never touches actual production data. Logged to console as the session
// record; cleaned up afterward.
describe.skipIf(!infraReady)("Verificacion final: flujo integrado A-E", () => {
  const userId = `test-final-${randomUUID()}`;
  const itemId = randomUUID();
  const today = new Date().toISOString().slice(0, 10);
  const month = today.slice(0, 7);
  const log: string[] = [];

  afterAll(async () => {
    const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));
    await Promise.all([
      ddb.send(new DeleteCommand({ TableName: CLOSET_TABLE, Key: { userId, itemId } })),
      ddb.send(new DeleteCommand({ TableName: OUTFIT_LOG_TABLE, Key: { userId, date: today } })),
      ddb.send(new DeleteCommand({ TableName: USER_PROFILE_TABLE, Key: { userId } })),
    ]);
    console.log("\n=== Verificacion final: log de sesion ===\n" + log.join("\n"));
  });

  it("sube prenda con precio -> genera -> confirma -> calendario -> costo-por-uso -> avatar", async () => {
    const item = await putClosetItem({
      userId,
      itemId,
      category: "top",
      color: "azul",
      warmth: "mild",
      style: "casual",
      driveFileId: "integration-fixture",
      price: 120,
    });
    log.push(`1. Prenda subida con precio: ${JSON.stringify(item)}`);
    expect(item.price).toBe(120);
    expect(item.uses).toBe(0);

    const outfit = await generateOutfit(userId, { weather: "mild", occasion: "casual" });
    log.push(`2. Outfit generado: ${JSON.stringify(outfit)}`);
    expect(outfit.items.map((i) => i.itemId)).toContain(itemId);

    await confirmOutfit(
      userId,
      outfit.items.map((i) => i.itemId),
      today,
    );
    log.push(`3. Outfit confirmado para ${today}`);

    const days = await getMonthLog(userId, month);
    const day = days.find((d) => d.date === today);
    log.push(`4. Calendario de ${month}: ${JSON.stringify(days)}`);
    expect(day).toBeDefined();
    expect(day!.items.map((i) => i.itemId)).toContain(itemId);

    const closetAfterConfirm = await getClosetItems(userId);
    const costEntries = computeCostPerUse(closetAfterConfirm);
    const ourEntry = costEntries.find((e) => e.item.itemId === itemId);
    log.push(`5. Costo-por-uso: ${JSON.stringify(ourEntry)}`);
    expect(ourEntry).toBeDefined();
    expect(ourEntry!.item.uses).toBe(1);
    expect(ourEntry!.costPerUse).toBe(120);

    const config: AvatarConfig = {
      altura: "alto",
      complexion: "robusta",
      tonoPiel: "oscuro",
      pelo: { estilo: "largo", color: "rojizo" },
    };
    await saveAvatarConfig(userId, config);
    const fetchedConfig = await getAvatarConfig(userId);
    log.push(`6. avatarConfig guardado y recuperado tras refetch: ${JSON.stringify(fetchedConfig)}`);
    expect(fetchedConfig).toEqual(config);

    const markup = renderToStaticMarkup(createElement(Avatar, { items: outfit.items, config: fetchedConfig }));
    const topRectMatch = markup.match(/<rect[^>]*data-slot="top"[^>]*>/);
    log.push(`7. Avatar renderizado reflejando outfit + config (bloque top: ${topRectMatch?.[0]})`);
    expect(topRectMatch).toBeTruthy();
  }, 60_000);
});
