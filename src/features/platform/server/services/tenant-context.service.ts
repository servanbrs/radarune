import "server-only";
import { headers } from "next/headers";
import { auth } from "@/features/authentication/server/auth";
import { tenantRepository } from "@/features/platform/server/repositories/tenant.repository";

function normalizeHost(host: string | null) {
  if (!host) return null;
  const value = host.trim().toLowerCase().split(",")[0]?.split(":")[0];
  return value && value !== "localhost" ? value : null;
}

export class TenantContextService {
  async resolveFromRequest() {
    const headerList = await headers();
    const host = normalizeHost(headerList.get("x-forwarded-host") ?? headerList.get("host"));
    if (host) {
      const byHost = await tenantRepository.findByHost(host);
      if (byHost) return byHost;
    }

    const session = await auth.api.getSession({ headers: headerList });
    if (!session) return null;
    const membership = await tenantRepository.findByMembership(session.user.id);
    return membership?.organization ?? null;
  }

  async requireForRequest() {
    const tenant = await this.resolveFromRequest();
    if (!tenant) {
      throw new Error("Tenant bağlamı bulunamadı.");
    }
    if (tenant.tenantStatus === "SUSPENDED" || tenant.tenantStatus === "CANCELLED" || tenant.tenantStatus === "ARCHIVED") {
      throw new Error("Tenant şu anda kullanıma açık değil.");
    }
    return tenant;
  }
}

export const tenantContextService = new TenantContextService();
