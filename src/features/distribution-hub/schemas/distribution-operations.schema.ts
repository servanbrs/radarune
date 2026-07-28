import { z } from "zod";

export const deadLetterListQuerySchema = z.object({
  take: z.coerce.number().int().min(1).max(100).default(50),
});

export const distributionJobIdSchema = z.string().trim().min(1).max(128);

export type DeadLetterListQuery = z.infer<
  typeof deadLetterListQuerySchema
>;
