import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import type { ClosetItem, NewClosetItem } from "@/types/closet";

export const CLOSET_TABLE = "ClosetItems";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
export const ddb = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

export async function putClosetItem(item: NewClosetItem): Promise<ClosetItem> {
  const full: ClosetItem = {
    ...item,
    uses: item.uses ?? 0,
    createdAt: item.createdAt ?? new Date().toISOString(),
  };
  await ddb.send(new PutCommand({ TableName: CLOSET_TABLE, Item: full }));
  return full;
}

export async function getClosetItems(userId: string): Promise<ClosetItem[]> {
  const result = await ddb.send(
    new QueryCommand({
      TableName: CLOSET_TABLE,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: { ":userId": userId },
    }),
  );
  return (result.Items ?? []) as ClosetItem[];
}

export async function incrementUses(
  userId: string,
  itemId: string,
  by = 1,
): Promise<number> {
  const result = await ddb.send(
    new UpdateCommand({
      TableName: CLOSET_TABLE,
      Key: { userId, itemId },
      UpdateExpression: "ADD #uses :incr",
      ExpressionAttributeNames: { "#uses": "uses" },
      ExpressionAttributeValues: { ":incr": by },
      ReturnValues: "UPDATED_NEW",
    }),
  );
  return (result.Attributes?.uses as number) ?? 0;
}
