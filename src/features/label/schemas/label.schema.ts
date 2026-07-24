import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createLabelSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Label name must be at least 2 characters.")
    .max(120, "Label name must be 120 characters or less."),
  slug: z
    .string()
    .trim()
    .min(3, "Label slug must be at least 3 characters.")
    .max(60, "Label slug must be 60 characters or less.")
    .regex(slugPattern, "Use lowercase letters, numbers, and single hyphens only."),
  legalName: z
    .string()
    .trim()
    .max(160, "Legal name must be 160 characters or less.")
    .optional()
    .transform((value) => value || undefined),
});

export type CreateLabelInput = z.infer<typeof createLabelSchema>;
