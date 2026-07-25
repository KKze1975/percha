import { describe, it, expect, vi, afterEach } from "vitest";
import { categorizeImage } from "@/lib/categorize";

// 1x1 transparent PNG, just to exercise a real HTTP round trip to the
// categorization endpoint without shipping a binary fixture.
const TEST_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

describe("3.2 categorizacion automatica por IA", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it.skipIf(!process.env.ANTHROPIC_API_KEY)(
    "hace un ciclo real: llamada a Claude, respuesta parseada a JSON valido o fallback",
    async () => {
      const result = await categorizeImage(TEST_PNG, "image/png");
      // Either a confident categorization, or the documented "revisar" fallback —
      // never an unhandled throw, and never a shape outside the contract.
      expect(["top", "bottom", "dress", "outerwear", "shoes", "accessory", "review"]).toContain(
        result.category,
      );
      expect(typeof result.needsReview).toBe("boolean");
    },
  );

  it("si la API responde error 500, cae al fallback 'revisar' sin romper la ruta", async () => {
    vi.doMock("@anthropic-ai/sdk", () => ({
      default: class {
        messages = {
          create: vi.fn().mockRejectedValue(new Error("500 internal server error")),
        };
      },
    }));
    const { categorizeImage: freshCategorize } = await import("@/lib/categorize");
    process.env.ANTHROPIC_API_KEY = "test-key";

    const result = await freshCategorize(TEST_PNG, "image/png");

    expect(result.needsReview).toBe(true);
    expect(result.category).toBe("review");
  });

  it("si el JSON es invalido/malformado, cae al fallback 'revisar' sin romper la ruta", async () => {
    vi.doMock("@anthropic-ai/sdk", () => ({
      default: class {
        messages = {
          create: vi.fn().mockResolvedValue({
            content: [{ type: "text", text: "esto no es JSON valido {{{" }],
          }),
        };
      },
    }));
    const { categorizeImage: freshCategorize } = await import("@/lib/categorize");
    process.env.ANTHROPIC_API_KEY = "test-key";

    const result = await freshCategorize(TEST_PNG, "image/png");

    expect(result.needsReview).toBe(true);
    expect(result.category).toBe("review");
  });
});
