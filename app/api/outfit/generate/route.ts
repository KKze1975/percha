import { NextRequest, NextResponse } from "next/server";
import { generateOutfit } from "@/lib/outfit";
import type { ClosetWarmth } from "@/types/closet";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { weather?: ClosetWarmth; occasion?: string };
  if (!body.weather || !body.occasion) {
    return NextResponse.json({ error: "Faltan weather u occasion" }, { status: 400 });
  }

  const userId = process.env.PERCHA_USER_ID ?? "default-user";
  const outfit = await generateOutfit(userId, { weather: body.weather, occasion: body.occasion });

  return NextResponse.json(outfit);
}
