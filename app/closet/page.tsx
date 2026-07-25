"use client";

import { useEffect, useRef, useState } from "react";
import { colorToHex } from "@/lib/colorMap";
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

export default function ClosetPage() {
  const [items, setItems] = useState<ClosetItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadItems = () => {
    fetch("/api/closet")
      .then((res) => res.json())
      .then((data) => setItems(data.items ?? []));
  };

  useEffect(loadItems, []);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const formData = new FormData();
    for (const file of Array.from(files)) formData.append("files", file);

    try {
      await fetch("/api/closet/upload", { method: "POST", body: formData });
      loadItems();
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Tu closet</h1>
        <p className="mt-1 text-sm text-muted">Sube fotos, una o varias a la vez.</p>
      </header>

      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-surface p-8 text-center transition-colors hover:border-accent">
        <span className="text-sm font-medium text-foreground">
          {uploading ? "Subiendo..." : "Toca para elegir fotos"}
        </span>
        <span className="text-xs text-muted">Puedes elegir varias a la vez</span>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="hidden"
          disabled={uploading}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </label>

      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => (
          <div
            key={item.itemId}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-border bg-surface p-2 text-center"
          >
            <span
              className="h-6 w-6 rounded-full border border-border"
              style={{ backgroundColor: colorToHex(item.color) }}
              aria-hidden
            />
            <span className="text-xs font-medium text-foreground">
              {CATEGORY_LABEL[item.category] ?? item.category}
            </span>
            <span className="text-[10px] text-muted">{item.uses} usos</span>
          </div>
        ))}
        {items.length === 0 && (
          <p className="col-span-3 py-6 text-center text-sm text-muted">
            Aun no hay prendas. Sube tu primera foto.
          </p>
        )}
      </div>
    </div>
  );
}
