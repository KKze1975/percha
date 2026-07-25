"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { DEFAULT_AVATAR_CONFIG } from "@/lib/avatarConfig";
import type { ClosetWarmth } from "@/types/closet";
import type { AvatarConfig } from "@/types/avatar";
import type { PackingDay } from "@/lib/packing";

export default function TripPage() {
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [weather, setWeather] = useState<ClosetWarmth>("mild");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ days: PackingDay[]; reason: string } | null>(null);
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(DEFAULT_AVATAR_CONFIG);

  useEffect(() => {
    fetch("/api/profile/avatar")
      .then((res) => res.json())
      .then((data) => setAvatarConfig(data.config ?? DEFAULT_AVATAR_CONFIG));
  }, []);

  const generate = async () => {
    if (!destination || !startDate || !endDate) return;
    setLoading(true);
    try {
      const res = await fetch("/api/trip/packing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination, startDate, endDate, weather, activities: [] }),
      });
      setResult(await res.json());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-serif text-3xl font-semibold text-foreground">Planea un viaje</h1>
        <p className="mt-1.5 text-[13px] text-muted">Genera una lista de empaque por dia.</p>
      </header>

      <input
        type="text"
        placeholder="Destino"
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
        className="rounded-[2px] border border-border px-3 py-2.5 text-[13px] text-foreground"
      />

      <div className="flex gap-2.5">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="flex-1 rounded-[2px] border border-border px-3 py-2.5 text-[13px] text-foreground"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="flex-1 rounded-[2px] border border-border px-3 py-2.5 text-[13px] text-foreground"
        />
      </div>

      <div>
        <span className="mb-2.5 block text-[11px] tracking-[0.1em] text-muted uppercase">Clima</span>
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

      <button
        type="button"
        onClick={generate}
        disabled={loading}
        className="rounded-[2px] bg-accent py-4 text-[15px] font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Generando..." : "Generar lista de empaque"}
      </button>

      {result && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">{result.reason}</p>
          {result.days.map((day) => (
            <div
              key={day.date}
              className="flex flex-col items-center gap-2.5 rounded-[4px] border border-border p-4"
            >
              <span className="text-[11px] tracking-[0.1em] text-muted uppercase">{day.date}</span>
              <Avatar items={day.items} config={avatarConfig} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
