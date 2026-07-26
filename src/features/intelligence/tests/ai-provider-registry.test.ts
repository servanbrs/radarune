import { describe, expect, it } from "vitest";
import { aiProviderRegistry } from "@/features/intelligence/server/adapters/ai-provider-registry";

describe("aiProviderRegistry", () => {
  it("harici provider yapılandırılmadığında sahte sonuç üretmez", async () => {
    const provider = aiProviderRegistry.get("OPENAI");
    const result = await provider.analyzeStructuredMetadata({ release: { title: "Radarune" } });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("CONFIGURATION_REQUIRED");
    }
  });

  it("internal rule engine text analizini provider gerektirir olarak döndürür", async () => {
    const provider = aiProviderRegistry.get("INTERNAL_RULE_ENGINE");
    const result = await provider.analyzeText({ text: "test" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("CONFIGURATION_REQUIRED");
    }
  });
});
