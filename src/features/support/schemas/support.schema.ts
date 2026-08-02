import { z } from "zod";

export const createSupportTicketSchema = z.object({
  subject: z.string().trim().min(3).max(180),
  message: z.string().trim().min(1).max(10_000),
  releaseId: z.string().trim().min(1).optional(),
  isrc: z.string().trim().toUpperCase().max(32).optional(),
  upc: z.string().trim().max(32).optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
});

export const createSupportMessageSchema = z.object({
  content: z.string().trim().min(1).max(10_000),
  internal: z.boolean().default(false),
});

export const updateSupportTicketSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "WAITING_USER", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  assignedUserId: z.string().trim().min(1).nullable().optional(),
});

export type CreateSupportTicketInput = z.infer<typeof createSupportTicketSchema>;

