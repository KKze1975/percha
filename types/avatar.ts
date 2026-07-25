export type AvatarAltura = "bajo" | "medio" | "alto";
export type AvatarComplexion = "delgada" | "media" | "robusta";

export interface AvatarConfig {
  altura: AvatarAltura;
  complexion: AvatarComplexion;
  tonoPiel: string;
  pelo: { estilo: string; color: string };
}

export interface UserProfile {
  userId: string;
  avatarConfig: AvatarConfig;
}
