import { getAvatarParts } from "@/lib/avatarParts";
import type { ClosetItem } from "@/types/closet";

const SKIN = "#e8b894";

export function Avatar({ items }: { items: ClosetItem[] }) {
  const parts = getAvatarParts(items);
  const fillFor = (slot: string) => parts.find((p) => p.slot === slot)?.fill;

  const bottomFill = fillFor("bottom");
  const dressFill = fillFor("dress");
  const topFill = fillFor("top");
  const outerwearFill = fillFor("outerwear");
  const shoesFill = fillFor("shoes");
  const accessoryFill = fillFor("accessory");

  return (
    <svg
      viewBox="0 0 120 220"
      width="120"
      height="220"
      role="img"
      aria-label="Avatar del outfit"
      data-testid="avatar-svg"
    >
      <circle cx="60" cy="30" r="20" fill={SKIN} />
      {dressFill ? (
        <rect x="35" y="55" width="50" height="110" rx="10" fill={dressFill} data-slot="dress" />
      ) : (
        <>
          <rect x="35" y="55" width="50" height="65" rx="8" fill={topFill ?? SKIN} data-slot="top" />
          <rect
            x="38"
            y="115"
            width="44"
            height="60"
            rx="6"
            fill={bottomFill ?? SKIN}
            data-slot="bottom"
          />
        </>
      )}
      {outerwearFill && (
        <rect
          x="28"
          y="52"
          width="64"
          height="75"
          rx="10"
          fill={outerwearFill}
          fillOpacity="0.65"
          data-slot="outerwear"
        />
      )}
      <rect x="40" y="175" width="16" height="30" fill={shoesFill ?? "#4b5563"} data-slot="shoes-left" />
      <rect x="64" y="175" width="16" height="30" fill={shoesFill ?? "#4b5563"} data-slot="shoes-right" />
      {accessoryFill && (
        <circle cx="60" cy="60" r="6" fill={accessoryFill} data-slot="accessory" />
      )}
    </svg>
  );
}
