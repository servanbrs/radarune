import "server-only";
import { headers } from "next/headers";
import { unstable_cache } from "next/cache";
import { auth } from "@/features/authentication/server/auth";
import { tenantRepository } from "@/features/platform/server/repositories/tenant.repository";

function normalizeHost(host: string | null) {
  if (!host) return null;
  const value = host.trim().toLowerCase().split(",")[0]?.split(":")[0];
  return value && value !== "localhost" ? value : null;
}

const getCachedTenantByHost = (host: string) =>
  unstable_cache(
    () => tenantRepository.findByHost(host),
    ["public-tenant-by-host", host],
    { revalidate: 60 },
  )();

const getCachedDefaultTenant = () =>
  unstable_cache(
    () => tenantRepository.findDefaultTenant(),
    ["public-default-tenant"],
    { revalidate: 60 },
  )();

export class TenantContextService {
  async resolveFromRequest() {
    const headerList = await headers();
    const host = normalizeHost(headerList.get("x-forwarded-host") ?? headerList.get("host"));
    if (host) {
      const byHost = await getCachedTenantByHost(host);
      if (byHost) return byHost;
    }

    // Local development has no tenant host header. Use the first active
    // workspace so branding (especially the uploaded favicon) remains visible
    // at localhost without requiring a signed-in session.
    if (!host && process.env.NODE_ENV !== "production") {
      return getCachedDefaultTenant();
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
