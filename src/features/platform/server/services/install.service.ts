import "server-only";
import { getProductionEnvironmentIssues, env } from "@/lib/env";
import { prisma } from "@/server/prisma/prisma";
import { storageProviderRegistry } from "@/features/storage/server/provider-registry";

export type InstallCheckStatus = "PASS" | "WARNING" | "FAIL";

export type InstallCheck = {
  key: string;
  label: string;
  status: InstallCheckStatus;
  message: string;
};

export type BootstrapStatus = {
  databaseReady: boolean;
  schemaReady: boolean;
  organizationCount: number | null;
  checks: InstallCheck[];
};

export class InstallService {
  async getBootstrapStatus(): Promise<BootstrapStatus> {
    const databaseReady = await this.checkDatabase();
    const organizationState = await this.checkOrganizationSchema(databaseReady);
    const environmentIssues = getProductionEnvironmentIssues();
    const storage = storageProviderRegistry.getConfigured();
    const storageConfiguration = storage.validateConfiguration();

    const checks: InstallCheck[] = [
      {
        key: "environment",
        label: "Environment",
        status: environmentIssues.length === 0 ? "PASS" : env.NODE_ENV === "production" ? "FAIL" : "WARNING",
        message: environmentIssues.length === 0 ? "Gerekli environment kontrolleri başarılı." : environmentIssues.join(" "),
      },
      {
        key: "database",
        label: "MySQL bağlantısı",
        status: databaseReady ? "PASS" : "FAIL",
        message: databaseReady ? "MySQL bağlantısı hazır." : "MySQL bağlantısı kurulamadı.",
      },
      {
        key: "schema",
        label: "Prisma şeması",
        status: organizationState.schemaReady ? "PASS" : "FAIL",
        message: organizationState.schemaReady ? "Gerekli tablolar hazır." : "Migration uygulanmamış veya şema okunamıyor.",
      },
      {
        key: "storage",
        label: "Dosya depolama",
        status: storageConfiguration.configured ? "PASS" : "WARNING",
        message: storageConfiguration.configured ? `${storage.type} storage yapılandırıldı.` : "Kalıcı storage yapılandırması gerekli.",
      },
    ];

    return {
      databaseReady,
      schemaReady: organizationState.schemaReady,
      organizationCount: organizationState.organizationCount,
      checks,
    };
  }

  private async checkDatabase() {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  private async checkOrganizationSchema(databaseReady: boolean) {
    if (!databaseReady) return { schemaReady: false, organizationCount: null };
    try {
      return {
        schemaReady: true,
        organizationCount: await prisma.organization.count(),
      };
    } catch {
      return { schemaReady: false, organizationCount: null };
    }
  }
}

export const installService = new InstallService();
