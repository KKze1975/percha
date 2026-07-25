"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { DEFAULT_AVATAR_CONFIG } from "@/lib/avatarConfig";
import { SKIN_TONES, HAIR_COLORS } from "@/lib/avatarPalette";
import type { AvatarAltura, AvatarComplexion, AvatarConfig } from "@/types/avatar";

const ALTURAS: { value: AvatarAltura; label: string }[] = [
  { value: "bajo", label: "Baja" },
  { value: "medio", label: "Media" },
  { value: "alto", label: "Alta" },
];

const COMPLEXIONES: { value: AvatarComplexion; label: string }[] = [
  { value: "delgada", label: "Delgada" },
  { value: "media", label: "Media" },
  { value: "robusta", label: "Robusta" },
];

const PEINADOS = ["corto", "medio", "largo"];

export default function AvatarSetupPage() {
  const [config, setConfig] = useState<AvatarConfig>(DEFAULT_AVATAR_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/profile/avatar")
      .then((res) => res.json())
      .then((data) => setConfig(data.config ?? DEFAULT_AVATAR_CONFIG))
      .finally(() => setLoading(false));
  }, []);

  const update = (patch: Partial<AvatarConfig>) => {
    setSaved(false);
    setConfig((prev) => ({ ...prev, ...patch }));
  };

  const save = async () => {
    await fetch("/api/profile/avatar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    setSaved(true);
  };

  if (loading) return <p className="text-sm text-muted">Cargando...</p>;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href="/outfit" className="text-xs text-muted">
          &larr; Outfit
        </Link>
        <h1 className="mt-1 font-serif text-3xl font-semibold text-foreground">Tu avatar</h1>
        <p className="mt-1.5 text-[13px] text-muted">
          Elige altura, complexion, tono de piel y pelo. Nada de esto usa fotos tuyas.
        </p>
      </header>

      <div className="flex justify-center">
        <Avatar items={[]} config={config} />
      </div>

      <div>
        <span className="mb-2.5 block text-[11px] tracking-[0.1em] text-muted uppercase">Altura</span>
        <div className="flex flex-wrap gap-2">
          {ALTURAS.map((a) => (
            <button
              key={a.value}
              type="button"
              onClick={() => update({ altura: a.value })}
              className={`rounded-full border px-4.5 py-2.5 text-[13px] ${
                config.altura === a.value
                  ? "border-accent bg-accent text-white"
                  : "border-border bg-transparent text-foreground/80"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-2.5 block text-[11px] tracking-[0.1em] text-muted uppercase">
          Complexion
        </span>
        <div className="flex flex-wrap gap-2">
          {COMPLEXIONES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => update({ complexion: c.value })}
              className={`rounded-full border px-4.5 py-2.5 text-[13px] ${
                config.complexion === c.value
                  ? "border-accent bg-accent text-white"
                  : "border-border bg-transparent text-foreground/80"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-2.5 block text-[11px] tracking-[0.1em] text-muted uppercase">
          Tono de piel
        </span>
        <div className="flex flex-wrap gap-2.5">
          {Object.entries(SKIN_TONES).map(([key, hex]) => (
            <button
              key={key}
              type="button"
              onClick={() => update({ tonoPiel: key })}
              aria-label={key}
              style={{ backgroundColor: hex }}
              className={`h-9 w-9 rounded-full border-2 ${
                config.tonoPiel === key ? "border-accent" : "border-border"
              }`}
            />
          ))}
        </div>
      </div>

      <div>
        <span className="mb-2.5 block text-[11px] tracking-[0.1em] text-muted uppercase">Pelo</span>
        <div className="flex flex-wrap gap-2 mb-2.5">
          {PEINADOS.map((estilo) => (
            <button
              key={estilo}
              type="button"
              onClick={() => update({ pelo: { ...config.pelo, estilo } })}
              className={`rounded-full border px-4.5 py-2.5 text-[13px] capitalize ${
                config.pelo.estilo === estilo
                  ? "border-accent-2 bg-accent-2 text-white"
                  : "border-border bg-transparent text-foreground/80"
              }`}
            >
              {estilo}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2.5">
          {Object.entries(HAIR_COLORS).map(([key, hex]) => (
            <button
              key={key}
              type="button"
              onClick={() => update({ pelo: { ...config.pelo, color: key } })}
              aria-label={key}
              style={{ backgroundColor: hex }}
              className={`h-9 w-9 rounded-full border-2 ${
                config.pelo.color === key ? "border-accent" : "border-border"
              }`}
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={save}
        className="rounded-[2px] bg-accent py-4 text-[15px] font-semibold text-white"
      >
        {saved ? "Guardado" : "Guardar"}
      </button>
    </div>
  );
}
