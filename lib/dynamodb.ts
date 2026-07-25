import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import type { ClosetItem, NewClosetItem } from "@/types/closet";
import type { AvatarConfig, UserProfile } from "@/types/avatar";

export const CLOSET_TABLE = "ClosetItems";
export const OUTFIT_LOG_TABLE = "OutfitLog";
export const USER_PROFILE_TABLE = "UserProfile";

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

export async function updateClosetItemPrice(
  userId: string,
  itemId: string,
  price: number,
): Promise<void> {
  await ddb.send(
    new UpdateCommand({
      TableName: CLOSET_TABLE,
      Key: { userId, itemId },
      UpdateExpression: "SET price = :price",
      ExpressionAttributeValues: { ":price": price },
    }),
  );
}

export async function getClosetItem(userId: string, itemId: string): Promise<ClosetItem | null> {
  const result = await ddb.send(new GetCommand({ TableName: CLOSET_TABLE, Key: { userId, itemId } }));
  return (result.Item as ClosetItem) ?? null;
}

export async function updateClosetItemPhoto(
  userId: string,
  itemId: string,
  driveFileId: string,
): Promise<void> {
  await ddb.send(
    new UpdateCommand({
      TableName: CLOSET_TABLE,
      Key: { userId, itemId },
      UpdateExpression: "SET driveFileId = :driveFileId",
      ExpressionAttributeValues: { ":driveFileId": driveFileId },
    }),
  );
}

export interface OutfitLogEntry {
  date: string;
  itemIds: string[];
}

export async function putOutfitLogEntry(
  userId: string,
  date: string,
  itemIds: string[],
): Promise<void> {
  await ddb.send(
    new PutCommand({
      TableName: OUTFIT_LOG_TABLE,
      Item: { userId, date, itemIds },
    }),
  );
}

export async function getOutfitLogRange(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<OutfitLogEntry[]> {
  const result = await ddb.send(
    new QueryCommand({
      TableName: OUTFIT_LOG_TABLE,
      KeyConditionExpression: "userId = :userId AND #date BETWEEN :start AND :end",
      ExpressionAttributeNames: { "#date": "date" },
      ExpressionAttributeValues: { ":userId": userId, ":start": startDate, ":end": endDate },
    }),
  );
  return (result.Items ?? []) as OutfitLogEntry[];
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const result = await ddb.send(
    new GetCommand({ TableName: USER_PROFILE_TABLE, Key: { userId } }),
  );
  return (result.Item as UserProfile) ?? null;
}

export async function putUserProfile(userId: string, avatarConfig: AvatarConfig): Promise<void> {
  await ddb.send(
    new PutCommand({ TableName: USER_PROFILE_TABLE, Item: { userId, avatarConfig } }),
  );
}
