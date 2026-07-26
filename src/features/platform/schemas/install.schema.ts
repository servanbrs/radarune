import { z } from "zod";

export const installStepValues = ["SYSTEM", "ADMIN", "WORKSPACE", "SETTINGS"] as const;

export const installStepSchema = z.enum(installStepValues);

export type InstallStep = z.infer<typeof installStepSchema>;
