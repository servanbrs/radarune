import { z } from "zod";

export const userDeletionRequestSchema = z.object({
  reason: z.string().trim().min(10, "Silme talebi için en az 10 karakter açıklama gereklidir.").max(2_000),
});

export const userDeletionAdminActionSchema = z.object({
  action: z.enum(["REVIEW", "REJECT", "ANONYMIZE"]),
  note: z.string().trim().max(2_000).optional(),
});

export type UserDeletionRequestInput = z.infer<typeof userDeletionRequestSchema>;
