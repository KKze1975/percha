"use client";

import { useState } from "react";
import { Avatar } from "@/components/Avatar";
import { colorToHex } from "@/lib/colorMap";
import type { CalendarDay } from "@/lib/calendar";
import type { AvatarConfig } from "@/types/avatar";

const CATEGORY_LABEL: Record<string, string> = {
  top: "Arriba",
  bottom: "Abajo",
  dress: "Vestido",
  outerwear: "Abrigo",
  shoes: "Zapatos",
  accessory: "Accesorio",
  review: "Por revisar",
};

export function Calendar({
  days,
  avatarConfig,
  onRepeat,
}: {
  days: CalendarDay[];
  avatarConfig: AvatarConfig;
  onRepeat: (day: CalendarDay) => void;
}) {
  const [selected, setSelected] = useState<CalendarDay | null>(null);
  const byDate = new Map(days.map((d) => [d.date, d]));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-5">
        {days.map((day) => {
          const active = selected?.date === day.date;
          return (
            <button
              key={day.date}
              type="button"
              onClick={() => setSelected(byDate.get(day.date) ?? null)}
              className={`flex flex-col items-center gap-1 rounded-[3px] border p-1.5 ${
                active ? "border-accent" : "border-border"
              }`}
            >
              <Avatar items={day.items} config={avatarConfig} width={40} height={73} />
              <span className="text-[10px] text-muted">{day.date.slice(-2)}</span>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="flex flex-col gap-3 rounded-[4px] border border-border p-4">
          <h2 className="font-serif text-lg text-foreground">{selected.date}</h2>
          <ul className="flex flex-col gap-1.5">
            {selected.items.map((item) => (
              <li key={item.itemId} className="flex items-center gap-2 text-[13px] text-foreground">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: colorToHex(item.color) }}
                />
                {CATEGORY_LABEL[item.category] ?? item.category} — {item.color}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => onRepeat(selected)}
            className="rounded-[2px] bg-accent-2 py-3 text-[13px] font-semibold text-white"
          >
            Repetir este outfit
          </button>
        </div>
      )}
    </div>
  );
}
