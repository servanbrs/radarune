import "server-only";
import { createLabelSchema, type CreateLabelInput } from "@/features/label/schemas/label.schema";
import { labelRepository } from "@/features/label/server/repositories/label.repository";

export class LabelService {
  async listByOrganizationId(organizationId: string) {
    return labelRepository.listByOrganizationId(organizationId);
  }

  async createForOrganization(params: {
    createdByUserId: string;
    input: CreateLabelInput;
    organizationId: string;
  }) {
    const parsedInput = createLabelSchema.safeParse(params.input);

    if (!parsedInput.success) {
      const firstError = Object.values(parsedInput.error.flatten().fieldErrors)
        .flat()
        .find(Boolean);

      return {
        success: false as const,
        message: firstError ?? "Invalid label details.",
      };
    }

    const existingLabel = await labelRepository.findBySlug(
      params.organizationId,
      parsedInput.data.slug,
    );

    if (existingLabel) {
      return {
        success: false as const,
        message: "This label slug is already in use in the current organization.",
      };
    }

    const label = await labelRepository.create({
      createdByUserId: params.createdByUserId,
      input: parsedInput.data,
      organizationId: params.organizationId,
    });

    return {
      success: true as const,
      data: label,
    };
  }
}

export const labelService = new LabelService();
