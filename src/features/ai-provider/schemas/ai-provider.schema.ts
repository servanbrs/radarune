import { z } from "zod";

import {
  aiProviderDefaultModels,
  aiProviderKeys,
} from "@/features/ai-provider/domain/ai-provider";

export const aiProviderKeySchema =
  z.enum(aiProviderKeys);

export const saveAiProviderSchema = z
  .object({
    provider: aiProviderKeySchema,

    apiKey: z
      .string()
      .trim()
      .min(
        10,
        "Geçerli bir API anahtarı girin.",
      ),

    model: z
      .string()
      .trim()
      .min(
        2,
        "Kullanılacak modeli seçin.",
      )
      .max(120),

    active: z
      .boolean()
      .default(true),

    autoImportReviewEnabled: z
      .boolean()
      .default(true),

    autoAcceptEnabled: z
      .boolean()
      .default(false),

    minimumReadinessScore: z
      .number()
      .int()
      .min(0)
      .max(100)
      .default(85),

    minimumConfidenceScore: z
      .number()
      .int()
      .min(0)
      .max(100)
      .default(90),
  })
  .superRefine((value, ctx) => {
    if (
      value.autoAcceptEnabled &&
      !value.autoImportReviewEnabled
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["autoAcceptEnabled"],
        message:
          "Otomatik kabul için AI import incelemesi açık olmalıdır.",
      });
    }
  });

export const testAiProviderSchema = z.object({
  provider: aiProviderKeySchema,

  apiKey: z
    .string()
    .trim()
    .min(
      10,
      "Bağlantıyı test etmek için API anahtarı girin.",
    ),

  model: z
    .string()
    .trim()
    .min(2)
    .max(120),
});

export const updateAiProviderSettingsSchema =
  z.object({
    provider: aiProviderKeySchema,

    model: z
      .string()
      .trim()
      .min(2)
      .max(120)
      .optional(),

    active: z
      .boolean()
      .optional(),

    autoImportReviewEnabled: z
      .boolean()
      .optional(),

    autoAcceptEnabled: z
      .boolean()
      .optional(),

    minimumReadinessScore: z
      .number()
      .int()
      .min(0)
      .max(100)
      .optional(),

    minimumConfidenceScore: z
      .number()
      .int()
      .min(0)
      .max(100)
      .optional(),
  });

export function defaultAiProviderSettings(
  provider: z.infer<typeof aiProviderKeySchema>,
) {
  return {
    provider,
    model: aiProviderDefaultModels[provider],
    active: true,
    autoImportReviewEnabled: true,
    autoAcceptEnabled: false,
    minimumReadinessScore: 85,
    minimumConfidenceScore: 90,
  };
}
