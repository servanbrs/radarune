import { z } from "zod";
import {
  deliveryStatusKeys,
  distributionCapabilityKeys,
  distributionProviderKeys,
  providerEnvironmentKeys,
} from "@/features/distribution-hub/domain/provider";

const distributionAssetReferenceSchema = z
  .string()
  .trim()
  .min(1, "Dosya referansı zorunludur.")
  .refine(
    (value) => {
      const normalized = value.toLowerCase();
      return !normalized.startsWith("javascript:") && !normalized.startsWith("data:");
    },
    "Güvensiz protokollere izin verilmez.",
  );

const providerSchema = z.enum(distributionProviderKeys);
const environmentSchema = z.enum(providerEnvironmentKeys);
const capabilitySchema = z.enum(distributionCapabilityKeys);

const canonicalTrackSchema = z.object({
  trackId: z.string().trim().min(1),
  title: z.string().trim().min(1).max(160),
  isrc: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}[A-Z0-9]{3}\d{7}$/, "ISRC formatı geçersiz.")
    .optional(),
  audioFileUrl: distributionAssetReferenceSchema,
  durationSeconds: z.number().int().positive().max(7200).optional(),
  explicit: z.boolean(),
  languageCode: z.string().trim().min(2).max(8).optional(),
  contributors: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(120),
        role: z.string().trim().min(1).max(80),
      }),
    )
    .max(50),
});

export const canonicalDistributionPayloadSchema = z.object({
  organizationId: z.string().trim().min(1),
  releaseId: z.string().trim().min(1),
  releaseVersion: z.number().int().positive(),
  releaseStatus: z.literal("APPROVED"),
  title: z.string().trim().min(1).max(160),
  subtitle: z.string().trim().max(160).optional(),
  isExistingRelease: z.boolean(),
  upc: z.string().trim().min(8).max(32).optional(),
  releaseType: z.string().trim().min(1).max(60),
  labelName: z.string().trim().max(160).optional(),
  copyrightLine: z.string().trim().max(255).optional(),
  productionLine: z.string().trim().max(255).optional(),
  releaseDate: z.coerce.date(),
  originalReleaseDate: z.coerce.date().optional(),
  artworkUrl: distributionAssetReferenceSchema,
  languageCode: z.string().trim().min(2).max(8).optional(),
  explicit: z.boolean(),
  presaveEnabled: z.boolean().default(false),
  contentIdEnabled: z.boolean().default(false),
  dolbyAtmosEnabled: z.boolean().default(false),
  artists: z
    .array(
      z.object({
        artistId: z.string().trim().min(1),
        name: z.string().trim().min(1).max(120),
        role: z.enum(["PRIMARY", "FEATURED"]),
      }),
    )
    .min(1),
  tracks: z.array(canonicalTrackSchema).min(1).max(200),
  stores: z
    .array(
      z.object({
        code: z.string().trim().min(1).max(60),
        enabled: z.boolean(),
      }),
    )
    .min(1),
  territories: z
    .array(
      z
        .string()
        .trim()
        .length(2, "Territory ISO kodu 2 karakter olmalıdır.")
        .transform((value) => value.toUpperCase()),
    )
    .min(1)
    .max(250),
});

export const providerConfigurationSchema = z.object({
  provider: providerSchema,
  isEnabled: z.boolean(),
  environment: environmentSchema,
  priority: z.number().int().min(1).max(1000),
  maxRetryCount: z.number().int().min(0).max(20),
  timeoutSeconds: z.number().int().min(5).max(300),
  supportsAutoIsrc: z.boolean(),
  supportsAutoUpc: z.boolean(),
  supportsWebhooks: z.boolean(),
  supportsUpdate: z.boolean(),
  supportsTakedown: z.boolean(),
  isDefault: z.boolean(),
  displayName: z.string().trim().max(120).optional(),
  credentials: z.record(z.string(), z.string().trim().min(1)).default({}),
  webhookSecret: z.string().trim().min(1).optional(),
  publicMetadata: z.record(z.string(), z.string().trim()).default({}),
  enabledCapabilities: z.array(capabilitySchema).default([]),
});

export const createDistributionJobSchema = z.object({
  provider: providerSchema.optional(),
  payload: canonicalDistributionPayloadSchema,
});

export const cancelDistributionJobSchema = z.object({
  reason: z.string().trim().min(3).max(280),
});

export const updateDeliveryStatusSchema = z.object({
  status: z.enum(deliveryStatusKeys),
  message: z.string().trim().max(500).optional(),
});

export type CanonicalDistributionPayloadInput = z.infer<
  typeof canonicalDistributionPayloadSchema
>;
export type ProviderConfigurationInput = z.infer<typeof providerConfigurationSchema>;
export type CreateDistributionJobInput = z.infer<typeof createDistributionJobSchema>;
