"use client";

import { useState } from "react";
import { Avatar } from "@/components/Avatar";
import type { ClosetItem, ClosetWarmth } from "@/types/closet";

const OCCASIONS = ["casual", "escuela", "salida", "formal"];

export default function OutfitPage() {
  const [weather, setWeather] = useState<ClosetWarmth>("mild");
  const [occasion, setOccasion] = useState(OCCASIONS[0]);
  const [loading, setLoading] = useState(false);
  const [outfit, setOutfit] = useState<{ items: ClosetItem[]; reason: string } | null>(null);
  const [confirmed, setConfirmed] = useState(false);

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

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Armar outfit</h1>
        <p className="mt-1 text-sm text-muted">Dinos el clima y la ocasion.</p>
      </header>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
        <div>
          <span className="mb-1 block text-xs font-medium text-muted">Clima</span>
          <div className="flex gap-2">
            {(["cold", "mild", "hot"] as const).map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setWeather(w)}
                className={`flex-1 rounded-full px-3 py-2 text-sm font-medium ${
                  weather === w ? "bg-accent text-white" : "bg-background text-muted"
                }`}
              >
                {w === "cold" ? "Frio" : w === "mild" ? "Templado" : "Calor"}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="mb-1 block text-xs font-medium text-muted">Ocasion</span>
          <div className="flex flex-wrap gap-2">
            {OCCASIONS.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => setOccasion(o)}
                className={`rounded-full px-3 py-2 text-sm font-medium capitalize ${
                  occasion === o ? "bg-accent text-white" : "bg-background text-muted"
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
          className="mt-2 rounded-full bg-accent-2 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Pensando..." : "Generar outfit"}
        </button>
      </div>

      {outfit && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface p-5">
          {outfit.items.length === 0 ? (
            <p className="text-sm text-muted">{outfit.reason}</p>
          ) : (
            <>
              <Avatar items={outfit.items} />
              <p className="text-center text-sm text-foreground">{outfit.reason}</p>
              <button
                type="button"
                onClick={confirm}
                disabled={confirmed}
                className="w-full rounded-full bg-accent py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {confirmed ? "Confirmado" : "Usar este outfit"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
