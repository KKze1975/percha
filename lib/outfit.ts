import Anthropic from "@anthropic-ai/sdk";
import { getClosetItems, incrementUses, putOutfitLogEntry } from "@/lib/dynamodb";
import type { ClosetItem, ClosetWarmth } from "@/types/closet";

export interface OutfitRequest {
  weather: ClosetWarmth;
  occasion: string;
}

export interface OutfitResult {
  items: ClosetItem[];
  reason: string;
}

function buildPrompt(items: ClosetItem[], request: OutfitRequest): string {
  const byCategory = new Map<string, ClosetItem[]>();
  for (const item of items) {
    const list = byCategory.get(item.category) ?? [];
    list.push(item);
    byCategory.set(item.category, list);
  }

  const lines: string[] = [];
  for (const [category, group] of byCategory) {
    group.sort((a, b) => a.uses - b.uses);
    lines.push(`\nCategoria: ${category}`);
    for (const item of group) {
      const priority = item.uses === 0 ? "PRIORIDAD ALTA (casi sin uso)" : `usada ${item.uses} veces`;
      lines.push(
        `- id=${item.itemId} color=${item.color} clima=${item.warmth} estilo=${item.style} (${priority})`,
      );
    }
  }

  return `Tienes este closet disponible:
${lines.join("\n")}

Arma UN outfit para clima "${request.weather}" y ocasion "${request.occasion}".

Regla mas importante: dentro de cada categoria que uses, elige la prenda con MENOS usos que sea apta para el clima y la ocasion. Solo salta una prenda de bajo uso si claramente no sirve para el clima u ocasion pedidos. No elijas la prenda de mas uso "porque si" cuando hay una de menos uso igual de apta.

Responde SOLO con JSON valido, sin texto adicional, con esta forma exacta:
{"itemIds": ["<id1>", "<id2>", ...], "reason": "<razon corta, una frase, en espanol>"}`;
}

// Claude sometimes wraps JSON in a ```json ... ``` fence despite instructions
// not to; strip it before parsing instead of treating it as malformed.
function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return match ? match[1] : trimmed;
}

function parseResponse(text: string, items: ClosetItem[]): OutfitResult | null {
  try {
    const parsed = JSON.parse(stripCodeFence(text)) as { itemIds?: unknown; reason?: unknown };
    if (!Array.isArray(parsed.itemIds) || typeof parsed.reason !== "string") return null;

    const byId = new Map(items.map((i) => [i.itemId, i]));
    const chosen = parsed.itemIds
      .filter((id): id is string => typeof id === "string")
      .map((id) => byId.get(id))
      .filter((i): i is ClosetItem => Boolean(i));

    if (chosen.length === 0) return null;
    return { items: chosen, reason: parsed.reason };
  } catch {
    return null;
  }
}

// Deterministic ranking mechanism shared by the daily generator's fallback
// path and the trip packing planner: pick the lowest-`uses` item per category
// that is weather-appropriate. `excludeItemIds` lets a caller building
// multiple combos in sequence (e.g. one per trip day) avoid repeating the
// same item — falling back to reuse only once a category has no unexcluded
// candidate left, rather than leaving that category empty.
export function pickLowestUseCombo(
  items: ClosetItem[],
  weather: ClosetWarmth,
  excludeItemIds: Set<string> = new Set(),
): ClosetItem[] {
  const suitable = items.filter((i) => i.warmth === weather && i.category !== "review");
  const pool = suitable.length > 0 ? suitable : items.filter((i) => i.category !== "review");

  const byCategory = new Map<string, ClosetItem[]>();
  for (const item of pool) {
    const group = byCategory.get(item.category) ?? [];
    group.push(item);
    byCategory.set(item.category, group);
  }

  const chosen: ClosetItem[] = [];
  for (const group of byCategory.values()) {
    const available = group.filter((i) => !excludeItemIds.has(i.itemId));
    const candidates = available.length > 0 ? available : group;
    chosen.push([...candidates].sort((a, b) => a.uses - b.uses)[0]);
  }
  return chosen;
}

// Deterministic safety net if Claude's response is missing/malformed. Keeps
// the ranking-by-uses mechanism intact even when the LLM call fails outright.
function fallbackOutfit(items: ClosetItem[], request: OutfitRequest): OutfitResult {
  return {
    items: pickLowestUseCombo(items, request.weather),
    reason: "Combinacion generada automaticamente priorizando prendas con menos uso.",
  };
}

export async function generateOutfit(
  userId: string,
  request: OutfitRequest,
): Promise<OutfitResult> {
  const items = (await getClosetItems(userId)).filter((i) => i.category !== "review");
  if (items.length === 0) {
    return { items: [], reason: "El closet esta vacio." };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return fallbackOutfit(items, request);
  }

  try {
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 512,
      messages: [{ role: "user", content: buildPrompt(items, request) }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const parsed =
      textBlock && textBlock.type === "text" ? parseResponse(textBlock.text, items) : null;

    return parsed ?? fallbackOutfit(items, request);
  } catch {
    return fallbackOutfit(items, request);
  }
}

// The uses-per-item counter (`ADD uses :incr`) is the core mechanism the
// ranking depends on and must succeed for confirmOutfit to succeed. The
// OutfitLog write is an additional view of the same event, not something
// the ranking mechanism depends on — a transient failure there (or the
// table not existing yet) must not block or fail the counter increments.
export async function confirmOutfit(
  userId: string,
  itemIds: string[],
  date: string = new Date().toISOString().slice(0, 10),
): Promise<void> {
  const [logResult] = await Promise.all([
    putOutfitLogEntry(userId, date, itemIds).then(
      () => null,
      (error: unknown) => error,
    ),
    ...itemIds.map((itemId) => incrementUses(userId, itemId)),
  ]);
  if (logResult) {
    console.error("confirmOutfit: fallo al escribir en OutfitLog", logResult);
  }
}
