"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { DEFAULT_AVATAR_CONFIG } from "@/lib/avatarConfig";
import type { ClosetItem, ClosetWarmth } from "@/types/closet";
import type { AvatarConfig } from "@/types/avatar";

const OCCASIONS = ["casual", "escuela", "salida", "formal"];

export default function OutfitPage() {
  const [weather, setWeather] = useState<ClosetWarmth>("mild");
  const [occasion, setOccasion] = useState(OCCASIONS[0]);
  const [loading, setLoading] = useState(false);
  const [outfit, setOutfit] = useState<{ items: ClosetItem[]; reason: string } | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(DEFAULT_AVATAR_CONFIG);

  useEffect(() => {
    fetch("/api/profile/avatar")
      .then((res) => res.json())
      .then((data) => setAvatarConfig(data.config ?? DEFAULT_AVATAR_CONFIG));
  }, []);

  const generate = async () => {
    setLoading(true);
    setConfirmed(false);
    try {
      const res = await fetch("/api/outfit/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weather, occasion }),
      });
      setOutfit(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const confirm = async () => {
    if (!outfit) return;
    await fetch("/api/outfit/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemIds: outfit.items.map((i) => i.itemId) }),
    });
    setConfirmed(true);
  };

  const reset = () => {
    setOutfit(null);
    setConfirmed(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-serif text-3xl font-semibold text-foreground">Arma tu outfit</h1>
        <p className="mt-1.5 text-[13px] text-muted">Dinos el clima y la ocasion.</p>
        <Link href="/avatar/setup" className="mt-1 block text-[11px] text-accent-2">
          Configurar avatar
        </Link>
      </header>

      <div>
        <span className="mb-2.5 block text-[11px] tracking-[0.1em] text-muted uppercase">
          Clima
        </span>
        <div className="flex flex-wrap gap-2">
          {(["cold", "mild", "hot"] as const).map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setWeather(w)}
              className={`rounded-full border px-4.5 py-2.5 text-[13px] ${
                weather === w
                  ? "border-accent bg-accent text-white"
                  : "border-border bg-transparent text-foreground/80"
              }`}
            >
              {w === "cold" ? "Frio" : w === "mild" ? "Templado" : "Calor"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-2.5 block text-[11px] tracking-[0.1em] text-muted uppercase">
          Ocasion
        </span>
        <div className="flex flex-wrap gap-2">
          {OCCASIONS.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => setOccasion(o)}
              className={`rounded-full border px-4.5 py-2.5 text-[13px] capitalize ${
                occasion === o
                  ? "border-accent-2 bg-accent-2 text-white"
                  : "border-border bg-transparent text-foreground/80"
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={generate}
        disabled={loading}
        className="rounded-[2px] bg-accent py-4 text-[15px] font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Generando..." : "Generar outfit"}
      </button>

      {outfit && (
        <div className="flex flex-col items-center gap-3.5 rounded-[4px] border border-border p-5">
          {outfit.items.length === 0 ? (
            <p className="text-sm text-muted">{outfit.reason}</p>
          ) : (
            <>
              <Avatar items={outfit.items} config={avatarConfig} />
              <p className="text-center text-sm text-foreground">{outfit.reason}</p>
              <div className="flex w-full gap-2.5">
                <button
                  type="button"
                  onClick={reset}
                  className="flex-1 rounded-[2px] border border-foreground py-3 text-[13px] text-foreground"
                >
                  Generar otro
                </button>
                <button
                  type="button"
                  onClick={confirm}
                  disabled={confirmed}
                  className="flex-1 rounded-[2px] bg-accent-2 py-3 text-[13px] font-semibold text-white disabled:opacity-60"
                >
                  {confirmed ? "Confirmado" : "Usar este outfit"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
