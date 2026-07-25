import { generateText } from "ai";

// ClosetItem doesn't persist a mime type (only used transiently at upload),
// so it's sniffed from the downloaded bytes instead of adding a new field --
// consistent with the PRD's "sin dato nuevo" framing for this feature.
export function sniffMimeType(buffer: Buffer): string {
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "image/png";
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") {
    return "image/webp";
  }
  return "image/jpeg";
}

// Gemini 3.1 Flash Image ("Nano Banana 2") is a language model with
// multimodal image output, not an ImageModelV4 -- it's called via
// generateText with the source photo as a file part, and the edited image
// comes back through result.files, not generateImage(). Routed through the
// Vercel AI Gateway model-string convention ("provider/model") rather than
// a direct @ai-sdk/google install, per this project's provider decision.
const MODEL = "google/gemini-3.1-flash-image";

const PROMPT =
  "Limpia el fondo de esta foto de una prenda de ropa: fondo blanco liso y " +
  "iluminacion pareja. No cambies el color, la forma ni los detalles de la prenda.";

export async function enhancePhoto(image: Buffer, mimeType: string): Promise<Buffer> {
  const result = await generateText({
    model: MODEL,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: PROMPT },
          { type: "file", data: image, mediaType: mimeType },
        ],
      },
    ],
  });

  const imageFile = result.files.find((file) => file.mediaType.startsWith("image/"));
  if (!imageFile) {
    throw new Error("El modelo no devolvio una imagen editada");
  }
  return Buffer.from(imageFile.uint8Array);
}
