const SPANISH_COLOR_TO_HEX: Record<string, string> = {
  azul: "#2563eb",
  rojo: "#dc2626",
  verde: "#16a34a",
  amarillo: "#eab308",
  negro: "#1f2937",
  blanco: "#f9fafb",
  gris: "#6b7280",
  cafe: "#92400e",
  marron: "#92400e",
  beige: "#d6c7a1",
  rosa: "#ec4899",
  morado: "#7c3aed",
  naranja: "#ea580c",
};

const FALLBACK_HEX = "#9ca3af";

export function colorToHex(colorName: string): string {
  const key = colorName.trim().toLowerCase();
  return SPANISH_COLOR_TO_HEX[key] ?? FALLBACK_HEX;
}
