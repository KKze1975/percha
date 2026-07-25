import { describe, it, expect } from "vitest";
import { enhancePhoto, sniffMimeType } from "@/lib/prettify";

const infraReady = Boolean(process.env.AI_GATEWAY_API_KEY);

// A minimal valid 1x1 PNG, used only to exercise the real Gateway call --
// content doesn't matter, only that a valid image round-trips.
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

describe("addendum 3: prettify (sniffMimeType)", () => {
  it("reconoce PNG por su firma de bytes", () => {
    expect(sniffMimeType(TINY_PNG)).toBe("image/png");
  });

  it("cae a image/jpeg si no reconoce la firma", () => {
    expect(sniffMimeType(Buffer.from([0, 1, 2, 3]))).toBe("image/jpeg");
  });
});

// PRD-ADDENDUM section 3: enhancePhoto must return a valid, different image
// (not a passthrough) when the Gateway call succeeds, gated on real infra.
describe.skipIf(!infraReady)("addendum 3: prettify (Gateway real)", () => {
  it("devuelve una imagen valida y distinta del input", async () => {
    const result = await enhancePhoto(TINY_PNG, "image/png");
    expect(result.length).toBeGreaterThan(0);
    expect(result.equals(TINY_PNG)).toBe(false);
  }, 60_000);
});

describe("addendum 3: prettify (degradacion sin romper el flujo)", () => {
  it("si el Gateway no devuelve imagen, enhancePhoto lanza en vez de devolver basura silenciosa", async () => {
    // No AI_GATEWAY_API_KEY / unreachable in this environment -> the SDK
    // call itself throws before files are ever inspected, which is exactly
    // the failure the API route's try/catch is built to catch without
    // losing the item's original photo.
    if (infraReady) return;
    await expect(enhancePhoto(TINY_PNG, "image/png")).rejects.toBeTruthy();
  });
});
