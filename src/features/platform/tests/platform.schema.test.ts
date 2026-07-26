import { describe, expect, it } from "vitest";
import { customDomainSchema, discoverConfigUpdateSchema, themeUpdateSchema } from "@/features/platform/schemas/platform.schema";

describe("platform schemas", () => {
  it("zararlı CSS rengini kabul etmez", () => {
    expect(() => themeUpdateSchema.parse({ primaryColor: "red; background:url(javascript:alert(1))" })).toThrow();
  });

  it("custom domain içinde protokol ve path kabul etmez", () => {
    expect(() => customDomainSchema.parse({ domain: "https://music.example.com/path" })).toThrow();
    expect(customDomainSchema.parse({ domain: "music.example.com" }).domain).toBe("music.example.com");
  });

  it("discover skor ağırlıklarını güvenli aralıkta doğrular", () => {
    expect(() => discoverConfigUpdateSchema.parse({ scoringWeights: { validStream: 2 } })).toThrow();
    expect(discoverConfigUpdateSchema.parse({ scoringWeights: { validStream: 0.5, like: 0.5 } }).scoringWeights?.like).toBe(0.5);
  });
});
