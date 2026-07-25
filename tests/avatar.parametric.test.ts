import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { computeAvatarGeometry } from "@/lib/avatarGeometry";
import { Avatar } from "@/components/Avatar";
import type { AvatarConfig } from "@/types/avatar";

const ALTO_ROBUSTA: AvatarConfig = {
  altura: "alto",
  complexion: "robusta",
  tonoPiel: "medio",
  pelo: { estilo: "corto", color: "negro" },
};

const BAJO_DELGADA: AvatarConfig = {
  altura: "bajo",
  complexion: "delgada",
  tonoPiel: "medio",
  pelo: { estilo: "corto", color: "negro" },
};

function extractRectDims(markup: string, slot: string): { width: number; height: number } {
  const match = markup.match(new RegExp(`<rect[^>]*data-slot="${slot}"[^>]*>`));
  if (!match) throw new Error(`no rect found for slot ${slot}`);
  const width = Number(match[0].match(/width="([\d.]+)"/)?.[1]);
  const height = Number(match[0].match(/height="([\d.]+)"/)?.[1]);
  return { width, height };
}

// PRD-ADDENDUM section 4: two clearly distinct parameter combinations must
// produce measurably different SVG proportions -- not just accept the prop.
describe("addendum 4: avatar parametrico", () => {
  it("computeAvatarGeometry produce dimensiones distintas para combinaciones distintas", () => {
    const big = computeAvatarGeometry(ALTO_ROBUSTA);
    const small = computeAvatarGeometry(BAJO_DELGADA);

    expect(big.torsoWidth).toBeGreaterThan(small.torsoWidth);
    expect(big.legWidth).toBeGreaterThan(small.legWidth);
    expect(big.totalHeight).toBeGreaterThan(small.totalHeight);
  });

  it("el SVG renderizado tiene bloques de torso/piernas medibles y distintos entre combinaciones", () => {
    const items: import("@/types/closet").ClosetItem[] = [];

    const bigMarkup = renderToStaticMarkup(
      createElement(Avatar, { items, config: ALTO_ROBUSTA }),
    );
    const smallMarkup = renderToStaticMarkup(
      createElement(Avatar, { items, config: BAJO_DELGADA }),
    );

    const bigTop = extractRectDims(bigMarkup, "top");
    const smallTop = extractRectDims(smallMarkup, "top");
    const bigBottom = extractRectDims(bigMarkup, "bottom");
    const smallBottom = extractRectDims(smallMarkup, "bottom");

    expect(bigTop.width).toBeGreaterThan(smallTop.width);
    expect(bigTop.height).toBeGreaterThan(smallTop.height);
    expect(bigBottom.width).toBeGreaterThan(smallBottom.width);
    expect(bigBottom.height).toBeGreaterThan(smallBottom.height);
  });
});
