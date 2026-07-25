import { describe, it, expect, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { processClosetUploads } from "@/lib/upload";
import { CLOSET_TABLE } from "@/lib/dynamodb";

// 1x1 PNG fixtures — distinct filenames stand in for distinct garment photos.
const TEST_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

const REQUIRED_ENV = [
  "AWS_REGION",
  "DRIVE_OAUTH_CLIENT_ID",
  "DRIVE_OAUTH_CLIENT_SECRET",
  "DRIVE_OAUTH_REFRESH_TOKEN",
  "DRIVE_FOLDER_ID",
  "ANTHROPIC_API_KEY",
];
const infraReady = REQUIRED_ENV.every((key) => Boolean(process.env[key]));

// 3.1: sube 1 imagen individual y 3 en batch, confirma 4 registros en
// DynamoDB con category, color, warmth, driveFileId no vacios. Corre contra
// Drive + DynamoDB + Claude reales — no mocks — por eso se salta si falta
// cualquier pieza de infraestructura (ver GOAL-PROMPT: no mockear de forma
// permanente).
describe.skipIf(!infraReady)("3.1 carga de closet: individual + batch", () => {
  const userId = `test-upload-${randomUUID()}`;

  afterAll(async () => {
    const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));
    const existing = await ddb.send(
      new QueryCommand({
        TableName: CLOSET_TABLE,
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: { ":userId": userId },
      }),
    );
    await Promise.all(
      (existing.Items ?? []).map((item) =>
        ddb.send(
          new DeleteCommand({
            TableName: CLOSET_TABLE,
            Key: { userId: item.userId, itemId: item.itemId },
          }),
        ),
      ),
    );
  });

  it("1 individual + 3 en batch producen 4 registros con campos no vacios", async () => {
    const individual = await processClosetUploads(userId, [
      { filename: "individual.png", mimeType: "image/png", buffer: TEST_PNG },
    ]);
    expect(individual).toHaveLength(1);

    const batch = await processClosetUploads(
      userId,
      [1, 2, 3].map((n) => ({
        filename: `batch-${n}.png`,
        mimeType: "image/png" as const,
        buffer: TEST_PNG,
      })),
    );
    expect(batch).toHaveLength(3);

    const all = [...individual, ...batch];
    expect(all).toHaveLength(4);
    for (const item of all) {
      expect(item.category).toBeTruthy();
      expect(item.color).toBeTruthy();
      expect(item.warmth).toBeTruthy();
      expect(item.driveFileId).toBeTruthy();
    }
  });
});
