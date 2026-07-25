import { NextResponse } from "next/server";
import { downloadFromDrive, uploadToDrive } from "@/lib/drive";
import { getClosetItem, updateClosetItemPhoto } from "@/lib/dynamodb";
import { enhancePhoto, sniffMimeType } from "@/lib/prettify";

export async function POST(_request: Request, ctx: RouteContext<"/api/closet/[itemId]/prettify">) {
  const { itemId } = await ctx.params;
  const userId = process.env.PERCHA_USER_ID ?? "default-user";

  const item = await getClosetItem(userId, itemId);
  if (!item) {
    return NextResponse.json({ error: "prenda no encontrada" }, { status: 404 });
  }

  const original = await downloadFromDrive(item.driveFileId);
  const mimeType = sniffMimeType(original);

  // Optional feature: if the Gateway call fails, the item keeps its
  // original photo instead of the whole request failing.
  try {
    const enhanced = await enhancePhoto(original, mimeType);
    const driveFileId = await uploadToDrive(enhanced, `${itemId}-prettified.png`, "image/png");
    await updateClosetItemPhoto(userId, itemId, driveFileId);
    return NextResponse.json({ ok: true, driveFileId });
  } catch (error) {
    console.error("prettify: fallo al mejorar la foto, se conserva el original", error);
    return NextResponse.json({ ok: false, error: "no se pudo mejorar la foto" }, { status: 502 });
  }
}
