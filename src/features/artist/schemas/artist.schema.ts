import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const artistTypeValues = [
  "SOLO",
  "BAND",
  "PRODUCER",
  "DJ",
  "COMPOSER",
] as const;

export const createArtistSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Artist name must be at least 2 characters.")
    .max(120, "Artist name must be 120 characters or less."),
  slug: z
    .string()
    .trim()
    .min(3, "Artist slug must be at least 3 characters.")
    .max(60, "Artist slug must be 60 characters or less.")
    .regex(slugPattern, "Use lowercase letters, numbers, and single hyphens only."),
  sortName: z
    .string()
    .trim()
    .max(120, "Sort name must be 120 characters or less.")
    .optional()
    .transform((value) => value || undefined),
  type: z.enum(artistTypeValues),
  spotifyProfileUrl: z
    .url("Enter a valid Spotify profile URL.")
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined),
  appleMusicProfileUrl: z
    .url("Enter a valid Apple Music profile URL.")
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined),
});

export type CreateArtistInput = z.infer<typeof createArtistSchema>;
