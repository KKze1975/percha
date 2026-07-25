import { colorToHex } from "@/lib/colorMap";
import type { ClosetItem } from "@/types/closet";

export type AvatarSlot = "outerwear" | "top" | "dress" | "bottom" | "shoes" | "accessory";

export interface AvatarPart {
  slot: AvatarSlot;
  fill: string;
  itemId: string;
}

const SLOT_ORDER: AvatarSlot[] = ["bottom", "dress", "top", "outerwear", "shoes", "accessory"];

// One item per slot: last one wins if the outfit has duplicates in a category.
export function getAvatarParts(items: ClosetItem[]): AvatarPart[] {
  const bySlot = new Map<AvatarSlot, ClosetItem>();
  for (const item of items) {
    if (item.category === "review") continue;
    bySlot.set(item.category as AvatarSlot, item);
  }

  return SLOT_ORDER.filter((slot) => bySlot.has(slot)).map((slot) => {
    const item = bySlot.get(slot)!;
    return { slot, fill: colorToHex(item.color), itemId: item.itemId };
  });
}
