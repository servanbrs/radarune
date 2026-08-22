import "server-only";
import { cache } from "react";
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

// `unstable_cache` caches completed results, but concurrent requests can still
// start the same slow database query before the first one finishes. Keep one
// in-flight lookup per key so a slow database never turns one page visit into
// a burst of identical pool consumers.
const inFlightLookups = new Map<string, Promise<unknown>>();

function shareInFlight<T>(key: string, lookup: () => Promise<T>) {
  const existing = inFlightLookups.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const pending = lookup().finally(() => {
    if (inFlightLookups.get(key) === pending) inFlightLookups.delete(key);
  });
  inFlightLookups.set(key, pending);
  return pending;
}

const resolveTenantForRequest = cache(async () => {
  const headerList = await headers();
  const host = normalizeHost(headerList.get("x-forwarded-host") ?? headerList.get("host"));

  if (host) {
    try {
      const byHost = await shareInFlight(`host:${host}`, () => getCachedTenantByHost(host));
      if (byHost) return byHost;
    } catch (error) {
      // Tenant lookup is optional for public chrome/metadata. A transient
      // database outage must not turn every public request into an error page.
      console.error("[TENANT_CONTEXT] Tenant lookup failed:", error);
      return null;
    }
  }

  // Local development has no tenant host header. Use the first active
  // workspace so branding remains visible without a signed-in session.
  if (!host && process.env.NODE_ENV !== "production") {
    return shareInFlight("default", getCachedDefaultTenant);
  }

  let session: Awaited<ReturnType<typeof auth.api.getSession>>;
  try {
    session = await auth.api.getSession({ headers: headerList });
  } catch (error) {
    console.error("[TENANT_CONTEXT] Session lookup failed:", error);
    return null;
  }
  if (!session) return null;
  try {
    return await shareInFlight(`membership:${session.user.id}`, async () => {
      const membership = await tenantRepository.findByMembership(session.user.id);
      return membership?.organization ?? null;
    });
  } catch (error) {
    console.error("[TENANT_CONTEXT] Membership lookup failed:", error);
    return null;
  }
});

export class TenantContextService {
  async resolveFromRequest() {
    return resolveTenantForRequest();
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
