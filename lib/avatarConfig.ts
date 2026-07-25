import { getUserProfile, putUserProfile } from "@/lib/dynamodb";
import type { AvatarConfig } from "@/types/avatar";

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  altura: "medio",
  complexion: "media",
  tonoPiel: "medio",
  pelo: { estilo: "corto", color: "negro" },
};

export async function getAvatarConfig(userId: string): Promise<AvatarConfig> {
  const profile = await getUserProfile(userId);
  return profile?.avatarConfig ?? DEFAULT_AVATAR_CONFIG;
}

export async function saveAvatarConfig(userId: string, config: AvatarConfig): Promise<void> {
  await putUserProfile(userId, config);
}
