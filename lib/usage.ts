import { getClosetItems } from "@/lib/dynamodb";

export interface UsageStats {
  total: number;
  usedCount: number;
  percentage: number;
}

export async function getUsageStats(userId: string): Promise<UsageStats> {
  const items = await getClosetItems(userId);
  const total = items.length;
  const usedCount = items.filter((item) => item.uses > 0).length;
  const percentage = total === 0 ? 0 : Math.round((usedCount / total) * 100);
  return { total, usedCount, percentage };
}
