import { NextRequest, NextResponse } from "next/server";
import { getMonthLog } from "@/lib/calendar";

export async function GET(request: NextRequest) {
  const month = request.nextUrl.searchParams.get("month");
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "month invalido, formato YYYY-MM" }, { status: 400 });
  }

  const userId = process.env.PERCHA_USER_ID ?? "default-user";
  const days = await getMonthLog(userId, month);

  return NextResponse.json({ days });
}
