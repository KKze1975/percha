import { getClosetItems } from "@/lib/dynamodb";
import { pickLowestUseCombo } from "@/lib/outfit";
import type { ClosetItem, ClosetWarmth } from "@/types/closet";

export interface PackingRequest {
  destination: string;
  startDate: string;
  endDate: string;
  activities: string[];
  weather: ClosetWarmth;
}

export interface PackingDay {
  date: string;
  items: ClosetItem[];
}

export interface PackingResult {
  days: PackingDay[];
  reason: string;
}

export function computeTripDays(startDate: string, endDate: string): string[] {
  const days: string[] = [];
  const cursor = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  while (cursor <= end) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

// Deterministic, no LLM call -- the PRD requires reusing the same ranking
// mechanism as the daily generator (pickLowestUseCombo), not the AI step.
// Each day accumulates already-chosen item ids so day 2+ is forced toward
// the next-lowest-use item per category instead of repeating day 1.
export async function generatePackingList(
  userId: string,
  request: PackingRequest,
): Promise<PackingResult> {
  const items = (await getClosetItems(userId)).filter((i) => i.category !== "review");
  const usedIds = new Set<string>();

  const days = computeTripDays(request.startDate, request.endDate).map((date) => {
    const combo = pickLowestUseCombo(items, request.weather, usedIds);
    combo.forEach((i) => usedIds.add(i.itemId));
    return { date, items: combo };
  });

  return {
    days,
    reason: `Lista de empaque para ${request.destination} priorizando prendas de menor uso.`,
  };
}
