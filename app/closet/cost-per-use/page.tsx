"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { computeCostPerUse } from "@/lib/costPerUse";
import type { ClosetItem } from "@/types/closet";

const CATEGORY_LABEL: Record<string, string> = {
  top: "Arriba",
  bottom: "Abajo",
  dress: "Vestido",
  outerwear: "Abrigo",
  shoes: "Zapatos",
  accessory: "Accesorio",
  review: "Por revisar",
};

export default function CostPerUsePage() {
  const [items, setItems] = useState<ClosetItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/closet")
      .then((res) => res.json())
      .then((data) => setItems(data.items ?? []))
      .finally(() => setLoading(false));
  }, []);

  const entries = computeCostPerUse(items);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <Link href="/closet" className="text-xs text-muted">
          &larr; Closet
        </Link>
        <h1 className="mt-1 font-serif text-3xl font-semibold text-foreground">Costo por uso</h1>
        <p className="mt-1.5 text-[13px] text-muted">
          Prendas con precio registrado, de mas cara a menos cara por uso.
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-muted">Cargando...</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted">
          Ninguna prenda tiene precio registrado todavia. Agrega un precio desde el closet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {entries.map(({ item, costPerUse }) => (
            <li
              key={item.itemId}
              className="flex items-center justify-between rounded-[3px] border border-border px-3.5 py-3"
            >
              <div>
                <span className="block text-[13px] text-foreground">
                  {CATEGORY_LABEL[item.category] ?? item.category} — {item.color}
                </span>
                <span className="text-[11px] text-muted">
                  ${item.price} / {item.uses} usos
                </span>
              </div>
              <span className="font-serif text-lg text-foreground">
                {costPerUse === Infinity ? "sin usar" : `$${costPerUse.toFixed(2)}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
