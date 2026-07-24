import { z } from "zod";

const organizationSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Organization name must be at least 2 characters.")
    .max(120, "Organization name must be 120 characters or less."),
  slug: z
    .string()
    .trim()
    .min(3, "Organization slug must be at least 3 characters.")
    .max(60, "Organization slug must be 60 characters or less.")
    .regex(
      organizationSlugPattern,
      "Slug can only contain lowercase letters, numbers, and single hyphens.",
    ),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
