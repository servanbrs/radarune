import "server-only";

import type { AdminSettingKey } from "@/generated/prisma/client";
import { prisma } from "@/server/prisma/prisma";
import type {
  ConfigurationParser,
  ConfigurationSource,
  ResolvedConfiguration,
} from "@/features/configuration/domain/configuration";

type CacheEntry = {
  expiresAt: number;
  value: ResolvedConfiguration<unknown>;
};

const DEFAULT_TTL_MS = 30_000;

function isPresent<T>(value: T | undefined): value is T {
  return value !== undefined;
}

class ConfigurationResolverService {
  private readonly cache = new Map<string, CacheEntry>();

  async resolve<T>(input: {
    key: AdminSettingKey;
    organizationId?: string;
    environmentValue?: unknown;
    defaultValue: T;
    parse?: ConfigurationParser<T>;
    ttlMs?: number;
  }): Promise<ResolvedConfiguration<T>> {
    const cacheKey = `${input.organizationId ?? "platform"}:${input.key}`;
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return { ...cached.value, cached: true } as ResolvedConfiguration<T>;
    }

    const rows = await prisma.adminSetting.findMany({
      where: {
        key: input.key,
        OR: [
          ...(input.organizationId ? [{ organizationId: input.organizationId }] : []),
          { organizationId: null },
        ],
      },
      select: { organizationId: true, value: true },
    });

    const organizationValue = rows.find(
      (row) => row.organizationId === input.organizationId,
    )?.value;
    const platformValue = rows.find((row) => row.organizationId === null)?.value;
    const parse = input.parse ?? ((value: unknown) => value as T);

    const candidates: Array<{
      source: ConfigurationSource;
      raw: unknown;
    }> = [
      ...(isPresent(organizationValue)
        ? [{ source: "ORGANIZATION" as const, raw: organizationValue }]
        : []),
      ...(isPresent(platformValue)
        ? [{ source: "PLATFORM" as const, raw: platformValue }]
        : []),
      ...(isPresent(input.environmentValue)
        ? [{ source: "ENVIRONMENT" as const, raw: input.environmentValue }]
        : []),
      { source: "DEFAULT", raw: input.defaultValue },
    ];

    const selected = candidates
      .map((candidate) => ({
        source: candidate.source,
        value: parse(candidate.raw),
      }))
      .find((candidate): candidate is { source: ConfigurationSource; value: T } =>
        candidate.value !== undefined,
      ) ?? { source: "DEFAULT" as const, value: input.defaultValue };

    const result: ResolvedConfiguration<T> = {
      value: selected.value,
      source: selected.source,
      cached: false,
    };

    this.cache.set(cacheKey, {
      expiresAt: Date.now() + (input.ttlMs ?? DEFAULT_TTL_MS),
      value: result,
    });

    return result;
  }

  invalidate(input?: { organizationId?: string; key?: AdminSettingKey }) {
    if (!input) {
      this.cache.clear();
      return;
    }

    const prefix = `${input.organizationId ?? "platform"}:`;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix) && (!input.key || key === `${prefix}${input.key}`)) {
        this.cache.delete(key);
      }
    }
  }

  resetForTests() {
    this.cache.clear();
  }
}

export const configurationResolver = new ConfigurationResolverService();

