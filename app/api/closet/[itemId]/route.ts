import { NextRequest, NextResponse } from "next/server";
import { updateClosetItemPrice } from "@/lib/dynamodb";

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/closet/[itemId]">) {
  const { itemId } = await ctx.params;
  const body = (await request.json()) as { price?: unknown };
  if (typeof body.price !== "number" || body.price < 0) {
    return NextResponse.json({ error: "price invalido" }, { status: 400 });
  }

  const userId = process.env.PERCHA_USER_ID ?? "default-user";
  await updateClosetItemPrice(userId, itemId, body.price);

  return NextResponse.json({ ok: true });
}
