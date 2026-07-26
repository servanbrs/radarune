import { describe, expect, it } from "vitest";
import { canDisplayExternalSource, playerCapabilities } from "@/features/player/domain/player-source";

describe("player source capabilities", () => {
  it("Spotify embed için unsupported seek kontrolü açmaz", () => {
    expect(playerCapabilities.SPOTIFY_EMBED.seek).toBe(false);
  });

  it("embed URL olmadan dış kaynak public player'a alınmaz", () => {
    expect(canDisplayExternalSource({ source: "YOUTUBE", embedUrl: null })).toBe(false);
  });
});
