import { z } from "zod";
import {
  contributorRoleValues,
  releaseArtistRoleValues,
  releaseStoreValues,
  releaseTypeValues,
} from "@/features/releases/constants/release.constants";

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

export const isrcSchema = z
  .preprocess(emptyToUndefined, z.string().regex(/^[A-Z]{2}[A-Z0-9]{3}[0-9]{7}$/, "ISRC biçimi geçerli değil. Örnek: TRABC2400001").optional());

export const upcSchema = z
  .preprocess(emptyToUndefined, z.string().regex(/^([0-9]{12}|[0-9]{13})$/, "UPC/EAN 12 veya 13 haneli olmalıdır.").optional());

export const releaseArtistInputSchema = z.object({
  artistId: z.string().min(1, "Sanatçı seçimi zorunludur."),
  role: z.enum(releaseArtistRoleValues),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const contributorInputSchema = z.object({
  name: z.string().trim().min(2, "Katkıda bulunan adı zorunludur.").max(160),
  role: z.enum(contributorRoleValues),
});

export const trackInputSchema = z
  .object({
    id: z.string().optional(),
    title: z.string().trim().min(1, "Parça adı zorunludur.").max(220),
    versionTitle: z.preprocess(emptyToUndefined, z.string().trim().max(120).optional()),
    trackNumber: z.coerce.number().int().min(1, "Parça numarası 1 veya daha büyük olmalıdır."),
    discNumber: z.coerce.number().int().min(1).default(1),
    language: z.string().trim().min(2, "Parça dili zorunludur.").max(12),
    explicit: z.boolean().default(false),
    instrumental: z.boolean().default(false),
    previouslyReleased: z.boolean().default(false),
    isrc: isrcSchema,
    durationMs: z.coerce.number().int().positive().optional(),
    lyrics: z.preprocess(emptyToUndefined, z.string().max(20000).optional()),
    previewStartSeconds: z.coerce.number().int().min(0).optional(),
    artists: z.array(releaseArtistInputSchema).min(1, "Her parçada en az bir sanatçı olmalıdır."),
    contributors: z.array(contributorInputSchema).default([]),
  })
  .superRefine((track, ctx) => {
    if (track.previouslyReleased && !track.isrc) {
      ctx.addIssue({
        code: "custom",
        message: "Daha önce dağıtılan parçalar için ISRC zorunludur.",
        path: ["isrc"],
      });
    }
  });

export const releaseDraftBaseSchema = z.object({
    title: z.string().trim().min(1, "Yayın adı zorunludur.").max(220),
    versionTitle: z.preprocess(emptyToUndefined, z.string().trim().max(120).optional()),
    primaryLanguage: z.string().trim().min(2, "Birincil dil zorunludur.").max(12),
    primaryGenre: z.string().trim().min(2, "Ana tür zorunludur.").max(80),
    secondaryGenre: z.preprocess(emptyToUndefined, z.string().trim().max(80).optional()),
    type: z.enum(releaseTypeValues),
    explicit: z.boolean().default(false),
    labelId: z.preprocess(emptyToUndefined, z.string().optional()),
    copyrightP: z.string().trim().min(2, "P telif bilgisi zorunludur.").max(220),
    copyrightC: z.string().trim().min(2, "C telif bilgisi zorunludur.").max(220),
    plannedReleaseDate: z.coerce.date().optional(),
    originalReleaseDate: z.coerce.date().optional(),
    previouslyReleased: z.boolean().default(false),
    upc: upcSchema,
    artists: z.array(releaseArtistInputSchema).min(1, "En az bir yayın sanatçısı seçilmelidir."),
    tracks: z.array(trackInputSchema).default([]),
    stores: z.array(z.enum(releaseStoreValues)).default([]),
    worldwideDistribution: z.boolean().default(true),
    territories: z.array(z.string().trim().length(2, "Bölge kodu ISO-2 formatında olmalıdır.")).default([]),
    presaveEnabled: z.boolean().default(false),
    dolbyAtmosEnabled: z.boolean().default(false),
    contentIdEnabled: z.boolean().default(false),
  });

export const releaseDraftSchema = releaseDraftBaseSchema
  .superRefine((release, ctx) => {
    if (release.previouslyReleased && !release.upc) {
      ctx.addIssue({
        code: "custom",
        message: "Daha önce dağıtılan yayınlar için UPC zorunludur.",
        path: ["upc"],
      });
    }

    const trackCount = release.tracks.length;
    if (release.type === "SINGLE" && trackCount !== 1) {
      ctx.addIssue({ code: "custom", message: "Single yayın tam olarak 1 parça içermelidir.", path: ["tracks"] });
    }
    if (release.type === "EP" && (trackCount < 2 || trackCount > 6)) {
      ctx.addIssue({ code: "custom", message: "EP yayın 2 ile 6 parça arasında olmalıdır.", path: ["tracks"] });
    }
    if (release.type === "ALBUM" && trackCount < 7) {
      ctx.addIssue({ code: "custom", message: "Albüm en az 7 parça içermelidir.", path: ["tracks"] });
    }

    if (release.stores.length === 0) {
      ctx.addIssue({ code: "custom", message: "En az bir mağaza seçilmelidir.", path: ["stores"] });
    }
  });

export const createReleaseSchema = releaseDraftBaseSchema.pick({
  title: true,
  primaryLanguage: true,
  primaryGenre: true,
  type: true,
  copyrightP: true,
  copyrightC: true,
}).extend({
  versionTitle: releaseDraftBaseSchema.shape.versionTitle,
  explicit: releaseDraftBaseSchema.shape.explicit,
  labelId: releaseDraftBaseSchema.shape.labelId,
});

export const updateReleaseSchema = releaseDraftBaseSchema.omit({ tracks: true }).partial().extend({
  tracks: z.array(trackInputSchema).optional(),
});

export const uploadMetadataSchema = z.object({
  kind: z.enum(["AUDIO", "ARTWORK"]),
});

export type ReleaseDraftInput = z.infer<typeof releaseDraftSchema>;
export type CreateReleaseInput = z.infer<typeof createReleaseSchema>;
export type UpdateReleaseInput = z.infer<typeof updateReleaseSchema>;
export type TrackInput = z.infer<typeof trackInputSchema>;
