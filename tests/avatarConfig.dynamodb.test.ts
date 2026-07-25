import { describe, it, expect, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { USER_PROFILE_TABLE } from "@/lib/dynamodb";
import { saveAvatarConfig, getAvatarConfig } from "@/lib/avatarConfig";
import type { AvatarConfig } from "@/types/avatar";

const infraReady = Boolean(process.env.AWS_REGION);

// PRD-ADDENDUM section 4: avatarConfig must persist in DynamoDB and survive
// a refetch (simulating a new session), same pattern as
// tests/persistence.dynamodb.test.ts for closet items.
describe.skipIf(!infraReady)("addendum 4: persistencia de avatarConfig", () => {
  const userId = `test-avatarconfig-${randomUUID()}`;

  afterAll(async () => {
    const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));
    await ddb.send(new DeleteCommand({ TableName: USER_PROFILE_TABLE, Key: { userId } }));
  });

  it("guardar avatarConfig sobrevive a un refetch en una sesion nueva", async () => {
    const config: AvatarConfig = {
      altura: "alto",
      complexion: "robusta",
      tonoPiel: "oscuro",
      pelo: { estilo: "largo", color: "rojizo" },
    };

    await saveAvatarConfig(userId, config);
    const fetched = await getAvatarConfig(userId);

    expect(fetched).toEqual(config);
  });
});
