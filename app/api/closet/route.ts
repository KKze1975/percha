import { NextResponse } from "next/server";
import { getClosetItems } from "@/lib/dynamodb";

export async function GET() {
  const userId = process.env.PERCHA_USER_ID ?? "default-user";
  const items = await getClosetItems(userId);
  return NextResponse.json({ items });
}
