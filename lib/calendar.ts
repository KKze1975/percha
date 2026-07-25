import { getClosetItems, getOutfitLogRange } from "@/lib/dynamodb";
import type { ClosetItem } from "@/types/closet";

export interface CalendarDay {
  date: string;
  items: ClosetItem[];
}

export async function getMonthLog(userId: string, yearMonth: string): Promise<CalendarDay[]> {
  const [entries, closetItems] = await Promise.all([
    getOutfitLogRange(userId, `${yearMonth}-01`, `${yearMonth}-31`),
    getClosetItems(userId),
  ]);

  const byId = new Map(closetItems.map((item) => [item.itemId, item]));
  return entries
    .map((entry) => ({
      date: entry.date,
      items: entry.itemIds.map((id) => byId.get(id)).filter((i): i is ClosetItem => Boolean(i)),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
