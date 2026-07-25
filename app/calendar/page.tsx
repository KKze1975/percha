"use client";

import { useEffect, useState } from "react";
import { Calendar } from "@/components/Calendar";
import { DEFAULT_AVATAR_CONFIG } from "@/lib/avatarConfig";
import type { CalendarDay } from "@/lib/calendar";
import type { AvatarConfig } from "@/types/avatar";

function currentYearMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export default function CalendarPage() {
  const [month, setMonth] = useState(currentYearMonth());
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(DEFAULT_AVATAR_CONFIG);

  useEffect(() => {
    fetch("/api/profile/avatar")
      .then((res) => res.json())
      .then((data) => setAvatarConfig(data.config ?? DEFAULT_AVATAR_CONFIG));
  }, []);

  const load = () => {
    setLoading(true);
    fetch(`/api/calendar?month=${month}`)
      .then((res) => res.json())
      .then((data) => setDays(data.days ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(load, [month]);

  const repeat = async (day: CalendarDay) => {
    await fetch("/api/outfit/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemIds: day.items.map((i) => i.itemId) }),
    });
    load();
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-serif text-3xl font-semibold text-foreground">Calendario</h1>
        <p className="mt-1.5 text-[13px] text-muted">Tus outfits confirmados del mes.</p>
      </header>

      <input
        type="month"
        value={month}
        onChange={(e) => setMonth(e.target.value)}
        className="rounded-[2px] border border-border px-3 py-2 text-[13px] text-foreground"
      />

      {loading ? (
        <p className="text-sm text-muted">Cargando...</p>
      ) : days.length === 0 ? (
        <p className="text-sm text-muted">Aun no hay outfits confirmados este mes.</p>
      ) : (
        <Calendar days={days} avatarConfig={avatarConfig} onRepeat={repeat} />
      )}
    </div>
  );
}
