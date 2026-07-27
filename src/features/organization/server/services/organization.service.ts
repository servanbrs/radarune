import "server-only";
import { redirect } from "next/navigation";
import { organizationRepository } from "@/features/organization/server/repositories/organization.repository";
import {
  createOrganizationSchema,
  type CreateOrganizationInput,
} from "@/features/organization/schemas/organization.schema";

export class OrganizationService {
  async getOptionalOrganizationContext(userId: string) {
    return organizationRepository.findPrimaryMembershipByUserId(userId);
  }

  async ensurePersonalOrganizationContext(
    userId: string,
    userName: string,
  ) {
    const existingOrganization =
      await this.getOptionalOrganizationContext(userId);

    if (existingOrganization) {
      return existingOrganization;
    }

    return organizationRepository.ensurePersonalOrganizationForUser(
      userId,
      userName,
    );
  }

  async getRequiredOrganizationContext(userId: string) {
    const membership = await this.getOptionalOrganizationContext(userId);

    if (!membership) {
      redirect("/dashboard");
    }

    return membership;
  }

  async createOrganizationForOwner(userId: string, input: CreateOrganizationInput) {
    const parsedInput = createOrganizationSchema.safeParse(input);

    if (!parsedInput.success) {
      const firstError = Object.values(parsedInput.error.flatten().fieldErrors)
        .flat()
        .find(Boolean);

      return {
        success: false as const,
        message: firstError ?? "Çalışma alanı bilgileri geçersiz.",
      };
    }

    const existingOrganization = await organizationRepository.findOrganizationBySlug(
      parsedInput.data.slug,
    );

    if (existingOrganization) {
      return {
        success: false as const,
        message: "Bu çalışma alanı kısa adı zaten kullanılıyor.",
      };
    }

    const organization = await organizationRepository.createOrganizationForOwner(
      userId,
      parsedInput.data,
    );

    return {
      success: true as const,
      data: organization,
    };
  }
}

export const organizationService = new OrganizationService();
