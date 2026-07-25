import type { AvatarAltura, AvatarComplexion, AvatarConfig } from "@/types/avatar";

export interface AvatarGeometry {
  totalHeight: number;
  torsoWidth: number;
  torsoHeight: number;
  legWidth: number;
  legHeight: number;
  shoulderWidth: number;
  headRadius: number;
}

// Base dimensions match the pre-parametric Avatar.tsx (viewBox 0 0 120 220,
// torso rect 50x65, bottom rect 44x60, outerwear rect 64 wide). Altura scales
// vertical dimensions, complexion scales horizontal ones, so the same
// combination never produces "the same drawing rescaled uniformly" — height
// and width vary independently per parameter.
const ALTURA_SCALE: Record<AvatarAltura, number> = { bajo: 0.85, medio: 1, alto: 1.15 };
const COMPLEXION_SCALE: Record<AvatarComplexion, number> = { delgada: 0.85, media: 1, robusta: 1.2 };

export function computeAvatarGeometry(config: AvatarConfig): AvatarGeometry {
  const h = ALTURA_SCALE[config.altura];
  const c = COMPLEXION_SCALE[config.complexion];

  return {
    totalHeight: 220 * h,
    torsoHeight: 65 * h,
    legHeight: 60 * h,
    torsoWidth: 50 * c,
    legWidth: 44 * c,
    shoulderWidth: 64 * c,
    headRadius: 20,
  };
}
