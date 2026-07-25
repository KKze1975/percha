import { NextResponse } from "next/server";
import { getUsageStats } from "@/lib/usage";

export async function GET() {
  const userId = process.env.PERCHA_USER_ID ?? "default-user";
  const stats = await getUsageStats(userId);
  return NextResponse.json(stats);
}
