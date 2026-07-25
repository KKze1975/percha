import { NextRequest, NextResponse } from "next/server";
import { generatePackingList } from "@/lib/packing";
import type { ClosetWarmth } from "@/types/closet";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    destination?: string;
    startDate?: string;
    endDate?: string;
    activities?: string[];
    weather?: ClosetWarmth;
  };

  if (!body.destination || !body.startDate || !body.endDate || !body.weather) {
    return NextResponse.json(
      { error: "Faltan destination, startDate, endDate o weather" },
      { status: 400 },
    );
  }

  const userId = process.env.PERCHA_USER_ID ?? "default-user";
  const result = await generatePackingList(userId, {
    destination: body.destination,
    startDate: body.startDate,
    endDate: body.endDate,
    activities: body.activities ?? [],
    weather: body.weather,
  });

  return NextResponse.json(result);
}
