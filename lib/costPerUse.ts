import type { ClosetItem } from "@/types/closet";

export interface CostPerUseEntry {
  item: ClosetItem;
  costPerUse: number;
}

// Items without a price are excluded (price is optional, not entering this
// view breaks nothing). uses:0 with a known price sorts to the top as
// Infinity — the most "expensive for what it's worth" case there is, which
// is exactly what this view is for.
export function computeCostPerUse(items: ClosetItem[]): CostPerUseEntry[] {
  return items
    .filter((item): item is ClosetItem & { price: number } => item.price != null)
    .map((item) => ({ item, costPerUse: item.uses === 0 ? Infinity : item.price / item.uses }))
    .sort((a, b) => b.costPerUse - a.costPerUse);
}
