"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { colorToHex } from "@/lib/colorMap";
import { compressImage } from "@/lib/compressImage";
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
  const [prettifying, setPrettifying] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadItems = () => {
    fetch("/api/closet")
      .then((res) => res.json())
      .then((data) => setItems(data.items ?? []));
  };

  useEffect(loadItems, []);

  const setPrice = async (itemId: string, price: number) => {
    await fetch(`/api/closet/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ price }),
    });
    loadItems();
  };

  const prettify = async (itemId: string) => {
    setPrettifying(itemId);
    try {
      await fetch(`/api/closet/${itemId}/prettify`, { method: "POST" });
      loadItems();
    } finally {
      setPrettifying(null);
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError(null);

    try {
      const compressed = await Promise.all(Array.from(files).map(compressImage));
      const formData = new FormData();
      for (const file of compressed) formData.append("files", file);

      const res = await fetch("/api/closet/upload", { method: "POST", body: formData });
      if (!res.ok) {
        setUploadError(
          res.status === 413
            ? "Las fotos son muy grandes. Intenta con menos fotos a la vez."
            : `No se pudo subir (error ${res.status}).`,
        );
        return;
      }
      loadItems();
    } catch {
      setUploadError("No se pudo subir. Revisa tu conexion e intenta de nuevo.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <input
        ref={inputRef}
        id="closet-file-input"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        className="hidden"
        disabled={uploading}
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className="flex items-end justify-between">
        <header>
          <h1 className="font-serif text-3xl font-semibold text-foreground">Tu closet</h1>
          <p className="mt-1 text-xs text-muted">{items.length} prendas</p>
          <Link href="/closet/cost-per-use" className="mt-1 block text-[11px] text-accent-2">
            Ver costo por uso
          </Link>
        </header>
        <label
          htmlFor="closet-file-input"
          className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-accent text-2xl leading-none text-white"
        >
          +
        </label>
      </div>

      {uploading && <p className="text-xs text-muted">Subiendo...</p>}
      {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}

      {items.length > 0 ? (
        <div className="grid grid-cols-2 gap-2.5">
          {items.map((item) => (
            <div
              key={item.itemId}
              className="relative flex aspect-square flex-col justify-end overflow-hidden rounded-[3px]"
              style={{ backgroundColor: colorToHex(item.color) }}
            >
              <div className="bg-black/35 px-2 py-1.5 text-center backdrop-blur-sm">
                <span className="block text-xs font-medium text-white">
                  {CATEGORY_LABEL[item.category] ?? item.category}
                </span>
                <span className="text-[10px] text-white/80">{item.uses} usos</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  defaultValue={item.price ?? ""}
                  placeholder="precio"
                  onBlur={(e) => {
                    const value = Number(e.target.value);
                    if (e.target.value !== "" && !Number.isNaN(value)) setPrice(item.itemId, value);
                  }}
                  className="mt-1 w-full rounded-[2px] bg-white/20 px-1 py-0.5 text-center text-[10px] text-white placeholder:text-white/60"
                />
                <button
                  type="button"
                  onClick={() => prettify(item.itemId)}
                  disabled={prettifying === item.itemId}
                  className="mt-1 w-full rounded-[2px] bg-white/20 px-1 py-0.5 text-center text-[10px] text-white disabled:opacity-60"
                >
                  {prettifying === item.itemId ? "Mejorando..." : "Mejorar foto"}
                </button>
              </div>
            </div>
          ))}
          <label
            htmlFor="closet-file-input"
            className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-[3px] border border-dashed border-border p-2 text-center text-xs text-muted"
          >
            Agregar mas
          </label>
        </div>
      ) : (
        <label
          htmlFor="closet-file-input"
          className="mt-2 flex cursor-pointer flex-col items-center gap-3 rounded-[4px] border border-dashed border-border p-12 text-center"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-muted text-2xl text-muted">
            +
          </span>
          <span className="font-serif text-lg text-foreground">Aun no hay prendas</span>
          <span className="max-w-[200px] text-[13px] text-muted">
            Toca para subir tu primera foto. Puedes elegir varias a la vez.
          </span>
        </label>
      )}
    </div>
  );
}
