// Predefined, selection-based sets for the parametric avatar's skin tone and
// hair color. Deliberately separate from lib/colorMap.ts, which maps garment
// color vocabulary (a different domain: clothing, not body/hair).
export const SKIN_TONES: Record<string, string> = {
  claro: "#f3d5b5",
  medio: "#e8b894",
  moreno: "#c68863",
  oscuro: "#8d5524",
};

export const HAIR_COLORS: Record<string, string> = {
  negro: "#1f2937",
  castano: "#6b4226",
  rubio: "#d4a94c",
  rojizo: "#a3402a",
  gris: "#9ca3af",
};

const DEFAULT_SKIN = SKIN_TONES.medio;
const DEFAULT_HAIR = HAIR_COLORS.negro;

export function skinToneToHex(tonoPiel: string): string {
  return SKIN_TONES[tonoPiel] ?? DEFAULT_SKIN;
}

export function hairColorToHex(color: string): string {
  return HAIR_COLORS[color] ?? DEFAULT_HAIR;
}
