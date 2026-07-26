import { z } from "zod";

const organizationSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Çalışma alanı adı en az 2 karakter olmalı.")
    .max(120, "Çalışma alanı adı 120 karakteri aşamaz."),
  slug: z
    .string()
    .trim()
    .min(3, "Kısa ad en az 3 karakter olmalı.")
    .max(60, "Kısa ad 60 karakteri aşamaz.")
    .regex(
      organizationSlugPattern,
      "Kısa ad yalnızca küçük harf, rakam ve tek tire içerebilir.",
    ),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
