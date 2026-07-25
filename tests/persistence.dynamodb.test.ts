import { describe, it, expect, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { putClosetItem, CLOSET_TABLE } from "@/lib/dynamodb";

// Section 3.5: reloading the page / a new session must preserve the full
// closet, including accumulated `uses` — not something backed by browser
// state. We simulate "new session" by instantiating a fresh DynamoDB client
// independent of the app's module-level singleton, and reading directly.
describe("3.5 persistencia real en DynamoDB", () => {
  const userId = `test-persistence-${randomUUID()}`;
  const itemId = randomUUID();

  afterAll(async () => {
    const cleanupClient = DynamoDBDocumentClient.from(
      new DynamoDBClient({ region: process.env.AWS_REGION }),
    );
    await cleanupClient.send(
      new DeleteCommand({ TableName: CLOSET_TABLE, Key: { userId, itemId } }),
    );
  });

  it("una escritura sobrevive a una sesion nueva sin cache de cliente", async () => {
    const written = await putClosetItem({
      userId,
      itemId,
      category: "top",
      color: "azul",
      warmth: "mild",
      style: "casual",
      driveFileId: "test-drive-file-id",
      uses: 3,
    });

    // Fresh client/session, not the module singleton from lib/dynamodb.
    const freshSession = DynamoDBDocumentClient.from(
      new DynamoDBClient({ region: process.env.AWS_REGION }),
    );
    const result = await freshSession.send(
      new GetCommand({ TableName: CLOSET_TABLE, Key: { userId, itemId } }),
    );

    expect(result.Item).toEqual(written);
    expect(result.Item?.uses).toBe(3);
  });
});
