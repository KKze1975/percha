import Anthropic from "@anthropic-ai/sdk";
import type { ClosetCategory, ClosetWarmth } from "@/types/closet";

const VALID_CATEGORIES: ClosetCategory[] = [
  "top",
  "bottom",
  "dress",
  "outerwear",
  "shoes",
  "accessory",
];
const VALID_WARMTH: ClosetWarmth[] = ["cold", "mild", "hot"];

export interface CategorizationResult {
  category: ClosetCategory | "review";
  color: string;
  warmth: ClosetWarmth;
  style: string;
  needsReview: boolean;
}

const FALLBACK: CategorizationResult = {
  category: "review",
  color: "desconocido",
  warmth: "mild",
  style: "desconocido",
  needsReview: true,
};

function isValid(json: unknown): json is Omit<CategorizationResult, "needsReview"> {
  if (typeof json !== "object" || json === null) return false;
  const j = json as Record<string, unknown>;
  return (
    typeof j.category === "string" &&
    VALID_CATEGORIES.includes(j.category as ClosetCategory) &&
    typeof j.color === "string" &&
    j.color.length > 0 &&
    typeof j.warmth === "string" &&
    VALID_WARMTH.includes(j.warmth as ClosetWarmth) &&
    typeof j.style === "string" &&
    j.style.length > 0
  );
}

const PROMPT = `Analiza esta foto de una prenda de ropa y responde SOLO con JSON valido, sin texto adicional, con esta forma exacta:
{"category": "top|bottom|dress|outerwear|shoes|accessory", "color": "<color principal en espanol, una palabra>", "warmth": "cold|mild|hot", "style": "<estilo en espanol, una o dos palabras>"}`;

export async function categorizeImage(
  imageBuffer: Buffer,
  mediaType: "image/jpeg" | "image/png" | "image/webp",
): Promise<CategorizationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return FALLBACK;
  }

  try {
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: imageBuffer.toString("base64"),
              },
            },
            { type: "text", text: PROMPT },
          ],
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") return FALLBACK;

    // Strip an occasional ```json ... ``` fence before parsing.
    const cleaned = textBlock.text.trim().replace(/^```(?:json)?\s*([\s\S]*?)\s*```$/, "$1");
    const parsed: unknown = JSON.parse(cleaned);
    if (!isValid(parsed)) return FALLBACK;

    return { ...parsed, needsReview: false };
  } catch {
    return FALLBACK;
  }
}
