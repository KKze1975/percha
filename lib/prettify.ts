import { generateText, type LanguageModel } from "ai";
import { google } from "@ai-sdk/google";
import { googleVertex } from "@ai-sdk/google-vertex";

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

// Gemini image models are language models with multimodal image output, not
// an ImageModelV4 -- called via generateText with the source photo as a file
// part, and the edited image comes back through result.files, not
// generateImage().
//
// Three transports, chosen at call time by which credential is present, in
// priority order:
// 1. Vertex AI (GOOGLE_VERTEX_PROJECT set) -- billed against existing GCP
//    credits, no new spend, the preferred path once configured.
// 2. Google AI Studio direct (GOOGLE_GENERATIVE_AI_API_KEY set) -- free
//    tier, no card, used for initial validation before GCP was wired up.
// 3. Vercel AI Gateway (default) -- the original provider decision, once
//    billing is set up there.
// "gemini-2.5-flash-image" is the version confirmed supported on both
// Vertex and Google AI Studio direct per each provider's own SDK docs;
// Gateway gets the newer "3.1" since that's confirmed available there.
const GATEWAY_MODEL = "google/gemini-3.1-flash-image";
const GOOGLE_MODEL = "gemini-2.5-flash-image";

const PROMPT =
  "Limpia el fondo de esta foto de una prenda de ropa: fondo blanco liso y " +
  "iluminacion pareja. No cambies el color, la forma ni los detalles de la prenda.";

// Explicit LanguageModel annotation keeps this a plain assignability check
// per branch instead of full structural inference over the union of each
// provider's model type -- without it, tsc blows its heap on
// @ai-sdk/google-vertex's type surface.
function selectModel(): LanguageModel {
  if (process.env.GOOGLE_VERTEX_PROJECT) return googleVertex(GOOGLE_MODEL);
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) return google(GOOGLE_MODEL);
  return GATEWAY_MODEL;
}

export async function enhancePhoto(image: Buffer, mimeType: string): Promise<Buffer> {
  const model = selectModel();

  const result = await generateText({
    model,
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
