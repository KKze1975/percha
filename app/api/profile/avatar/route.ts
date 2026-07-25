import { NextRequest, NextResponse } from "next/server";
import { getAvatarConfig, saveAvatarConfig } from "@/lib/avatarConfig";
import type { AvatarConfig } from "@/types/avatar";

export async function GET() {
  const userId = process.env.PERCHA_USER_ID ?? "default-user";
  const config = await getAvatarConfig(userId);
  return NextResponse.json({ config });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Partial<AvatarConfig>;
  if (
    !body.altura ||
    !body.complexion ||
    !body.tonoPiel ||
    !body.pelo?.estilo ||
    !body.pelo?.color
  ) {
    return NextResponse.json({ error: "avatarConfig incompleto" }, { status: 400 });
  }

  const userId = process.env.PERCHA_USER_ID ?? "default-user";
  await saveAvatarConfig(userId, body as AvatarConfig);

  return NextResponse.json({ ok: true });
}
