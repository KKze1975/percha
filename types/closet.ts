export type ClosetCategory =
  | "top"
  | "bottom"
  | "dress"
  | "outerwear"
  | "shoes"
  | "accessory";

export type ClosetWarmth = "cold" | "mild" | "hot";

export interface ClosetItem {
  userId: string;
  itemId: string;
  category: ClosetCategory | "review";
  color: string;
  warmth: ClosetWarmth;
  style: string;
  uses: number;
  driveFileId: string;
  createdAt: string;
  needsReview?: boolean;
}

export type NewClosetItem = Omit<ClosetItem, "uses" | "createdAt"> & {
  uses?: number;
  createdAt?: string;
};
