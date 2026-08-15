import "server-only";
import {
  createArtistSchema,
  type CreateArtistInput,
} from "@/features/artist/schemas/artist.schema";
import { artistRepository } from "@/features/artist/server/repositories/artist.repository";

export class ArtistService {
  async listByOrganizationId(organizationId: string, search?: string, global = false) {
    return artistRepository.listByOrganizationId(organizationId, search, global);
  }

  async createForOrganization(params: {
    createdByUserId: string;
    ownerUserId?: string;
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
      ...(params.ownerUserId ? { ownerUserId: params.ownerUserId } : {}),
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
