import { NextRequest, NextResponse } from "next/server";
import { confirmOutfit } from "@/lib/outfit";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { itemIds?: unknown };
  if (!Array.isArray(body.itemIds) || body.itemIds.some((id) => typeof id !== "string")) {
    return NextResponse.json({ error: "itemIds invalido" }, { status: 400 });
  }

  const userId = process.env.PERCHA_USER_ID ?? "default-user";
  await confirmOutfit(userId, body.itemIds as string[]);

  return NextResponse.json({ ok: true });
}
