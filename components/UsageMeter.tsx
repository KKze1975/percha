"use client";

import { useEffect, useState } from "react";
import type { UsageStats } from "@/lib/usage";

export function UsageMeter() {
  const [stats, setStats] = useState<UsageStats | null>(null);

  useEffect(() => {
    fetch("/api/closet/usage")
      .then((res) => res.json())
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  if (!stats) {
    return <div className="h-24 animate-pulse rounded-[4px] bg-border" />;
  }

  if (stats.total === 0) {
    return (
      <div className="rounded-[4px] border border-border p-5">
        <p className="text-sm text-muted">
          Todavia no tienes prendas cargadas. Empieza por tu closet.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[4px] border border-border p-5">
      <p className="text-sm text-muted">Closet realmente usado</p>
      <div className="mt-2 flex items-end gap-2">
        <span className="font-serif text-4xl font-semibold text-accent">{stats.percentage}%</span>
        <span className="pb-1 text-sm text-muted">
          {stats.usedCount} de {stats.total} prendas
        </span>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${stats.percentage}%` }}
        />
      </div>
    </div>
  );
}
