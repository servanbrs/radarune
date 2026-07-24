import "server-only";
import {
  createArtistSchema,
  type CreateArtistInput,
} from "@/features/artist/schemas/artist.schema";
import { artistRepository } from "@/features/artist/server/repositories/artist.repository";

export class ArtistService {
  async listByOrganizationId(organizationId: string) {
    return artistRepository.listByOrganizationId(organizationId);
  }

  async createForOrganization(params: {
    createdByUserId: string;
    input: CreateArtistInput;
    organizationId: string;
  }) {
    const parsedInput = createArtistSchema.safeParse(params.input);

    if (!parsedInput.success) {
      const firstError = Object.values(parsedInput.error.flatten().fieldErrors)
        .flat()
        .find(Boolean);

      return {
        success: false as const,
        message: firstError ?? "Invalid artist details.",
      };
    }

    const existingArtist = await artistRepository.findBySlug(
      params.organizationId,
      parsedInput.data.slug,
    );

    if (existingArtist) {
      return {
        success: false as const,
        message: "This artist slug is already in use in the current organization.",
      };
    }

    const artist = await artistRepository.create({
      createdByUserId: params.createdByUserId,
      input: parsedInput.data,
      organizationId: params.organizationId,
    });

    return {
      success: true as const,
      data: artist,
    };
  }
}

export const artistService = new ArtistService();
