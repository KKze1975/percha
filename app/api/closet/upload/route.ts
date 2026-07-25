import { NextRequest, NextResponse } from "next/server";
import { processClosetUploads, type UploadInput } from "@/lib/upload";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const entries = formData.getAll("files");

  if (entries.length === 0) {
    return NextResponse.json({ error: "No se recibieron archivos" }, { status: 400 });
  }

  const files: UploadInput[] = [];
  for (const entry of entries) {
    if (!(entry instanceof File)) continue;
    if (!ALLOWED_MIME.has(entry.type)) {
      return NextResponse.json(
        { error: `Tipo de archivo no soportado: ${entry.type}` },
        { status: 400 },
      );
    }
    files.push({
      filename: entry.name,
      mimeType: entry.type as UploadInput["mimeType"],
      buffer: Buffer.from(await entry.arrayBuffer()),
    });
  }

  const userId = process.env.PERCHA_USER_ID ?? "default-user";
  const items = await processClosetUploads(userId, files);

  return NextResponse.json({ items }, { status: 201 });
}
