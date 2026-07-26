import "server-only";
import { redirect } from "next/navigation";
import { growthRepository } from "@/features/growth/server/repositories/growth.repository";

export class ArtistPublicProfileService {
  async getBySlug(slug: string) {
    const artist = await growthRepository.findPublicArtist(slug);
    if (artist) {
      return artist;
    }

    const redirectTarget = await growthRepository.findSlugRedirect(slug);
    if (redirectTarget) {
      redirect(`/artist/${redirectTarget.newSlug}`);
    }

    return null;
  }
}

export const artistPublicProfileService = new ArtistPublicProfileService();
