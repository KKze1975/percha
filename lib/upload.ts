import { randomUUID } from "node:crypto";
import { uploadToDrive } from "@/lib/drive";
import { categorizeImage } from "@/lib/categorize";
import { putClosetItem } from "@/lib/dynamodb";
import type { ClosetItem } from "@/types/closet";

export interface UploadInput {
  filename: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  buffer: Buffer;
}

// Individual upload is batch-of-one through this same path, per PRD 3.1.
export async function processClosetUploads(
  userId: string,
  files: UploadInput[],
): Promise<ClosetItem[]> {
  return Promise.all(
    files.map(async (file) => {
      const driveFileId = await uploadToDrive(file.buffer, file.filename, file.mimeType);
      const categorization = await categorizeImage(file.buffer, file.mimeType);

      return putClosetItem({
        userId,
        itemId: randomUUID(),
        category: categorization.category,
        color: categorization.color,
        warmth: categorization.warmth,
        style: categorization.style,
        driveFileId,
        needsReview: categorization.needsReview,
      });
    }),
  );
}
