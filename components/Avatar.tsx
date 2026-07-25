import { getAvatarParts } from "@/lib/avatarParts";
import { computeAvatarGeometry } from "@/lib/avatarGeometry";
import { skinToneToHex, hairColorToHex } from "@/lib/avatarPalette";
import type { ClosetItem } from "@/types/closet";
import type { AvatarConfig } from "@/types/avatar";

export function Avatar({
  items,
  config,
  width,
  height,
}: {
  items: ClosetItem[];
  config: AvatarConfig;
  width?: number;
  height?: number;
}) {
  const parts = getAvatarParts(items);
  const fillFor = (slot: string) => parts.find((p) => p.slot === slot)?.fill;

  const bottomFill = fillFor("bottom");
  const dressFill = fillFor("dress");
  const topFill = fillFor("top");
  const outerwearFill = fillFor("outerwear");
  const shoesFill = fillFor("shoes");
  const accessoryFill = fillFor("accessory");

  const geo = computeAvatarGeometry(config);
  const skin = skinToneToHex(config.tonoPiel);
  const hair = hairColorToHex(config.pelo.color);

  // Canvas grows with the figure so scaled-up combinations never clip;
  // proportions come entirely from `geo`, not a fixed drawing rescaled.
  const viewWidth = Math.max(120, geo.shoulderWidth + 56);
  const centerX = viewWidth / 2;
  const headCenterY = geo.headRadius + 10;
  const torsoY = headCenterY + geo.headRadius + 5;
  const torsoX = centerX - geo.torsoWidth / 2;
  const legY = torsoY + geo.torsoHeight;
  const legX = centerX - geo.legWidth / 2;
  const shoesY = legY + geo.legHeight;
  const shoesHeight = 30;
  const shoesWidth = 16;
  const outerwearY = torsoY - 3;
  const outerwearHeight = geo.torsoHeight + 10;
  const outerwearX = centerX - geo.shoulderWidth / 2;
  const viewHeight = shoesY + shoesHeight + 15;

  return (
    <svg
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      width={width ?? viewWidth}
      height={height ?? viewHeight}
      role="img"
      aria-label="Avatar del outfit"
      data-testid="avatar-svg"
    >
      <circle
        cx={centerX}
        cy={headCenterY}
        r={geo.headRadius}
        fill={skin}
        data-slot="head"
      />
      <path
        d={`M ${centerX - geo.headRadius} ${headCenterY - 4} A ${geo.headRadius} ${geo.headRadius} 0 0 1 ${centerX + geo.headRadius} ${headCenterY - 4} Q ${centerX} ${headCenterY - geo.headRadius - 8} ${centerX - geo.headRadius} ${headCenterY - 4} Z`}
        fill={hair}
        data-slot="hair"
      />
      {dressFill ? (
        <rect
          x={torsoX}
          y={torsoY}
          width={geo.torsoWidth}
          height={geo.torsoHeight + geo.legHeight}
          rx="10"
          fill={dressFill}
          data-slot="dress"
        />
      ) : (
        <>
          <rect
            x={torsoX}
            y={torsoY}
            width={geo.torsoWidth}
            height={geo.torsoHeight}
            rx="8"
            fill={topFill ?? skin}
            data-slot="top"
          />
          <rect
            x={legX}
            y={legY}
            width={geo.legWidth}
            height={geo.legHeight}
            rx="6"
            fill={bottomFill ?? skin}
            data-slot="bottom"
          />
        </>
      )}
      {outerwearFill && (
        <rect
          x={outerwearX}
          y={outerwearY}
          width={geo.shoulderWidth}
          height={outerwearHeight}
          rx="10"
          fill={outerwearFill}
          fillOpacity="0.65"
          data-slot="outerwear"
        />
      )}
      <rect
        x={legX}
        y={shoesY}
        width={shoesWidth}
        height={shoesHeight}
        fill={shoesFill ?? "#4b5563"}
        data-slot="shoes-left"
      />
      <rect
        x={legX + geo.legWidth - shoesWidth}
        y={shoesY}
        width={shoesWidth}
        height={shoesHeight}
        fill={shoesFill ?? "#4b5563"}
        data-slot="shoes-right"
      />
      {accessoryFill && (
        <circle
          cx={centerX}
          cy={torsoY + 5}
          r="6"
          fill={accessoryFill}
          data-slot="accessory"
        />
      )}
    </svg>
  );
}
