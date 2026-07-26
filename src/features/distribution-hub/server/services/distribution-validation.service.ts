import "server-only";
import type {
  CanonicalDistributionPayload,
  DistributionProviderRuntimeConfiguration,
  DistributionProviderKey,
  DistributionValidationIssue,
} from "@/features/distribution-hub/domain/provider";
import { distributionProviderRegistry } from "@/features/distribution-hub/server/provider-registry";
import { validateProviderCodeRules } from "@/features/distribution-hub/server/services/provider-code-rules";

export class DistributionValidationService {
  validateRelease(
    provider: DistributionProviderKey,
    payload: CanonicalDistributionPayload,
    runtimeConfiguration?: {
      isEnabled?: boolean;
      supportsAutoIsrc?: boolean;
      supportsAutoUpc?: boolean;
      enabledCapabilities?: string[];
      runtime?: DistributionProviderRuntimeConfiguration | null;
    } | null,
  ) {
    const adapter = distributionProviderRegistry.getAdapter(provider);
    const adapterResult = adapter.validateRelease(payload);
    const issues: DistributionValidationIssue[] = [...adapterResult.issues];
    const supportsAutoUpc =
      runtimeConfiguration?.supportsAutoUpc ?? adapter.supportsCapability("AUTO_UPC");
    const supportsAutoIsrc =
      runtimeConfiguration?.supportsAutoIsrc ?? adapter.supportsCapability("AUTO_ISRC");

    if (provider !== "INTERNAL" && !runtimeConfiguration) {
      issues.push({
        code: "PROVIDER_CONFIGURATION_REQUIRED",
        field: "provider",
        message: "Harici provider için yapılandırma ve credential gereklidir.",
        severity: "ERROR",
      });
    }

    if (runtimeConfiguration && runtimeConfiguration.isEnabled === false) {
      issues.push({
        code: "PROVIDER_DISABLED",
        field: "provider",
        message: "Seçilen dağıtım sağlayıcısı aktif değil.",
        severity: "ERROR",
      });
    }

    if (!adapter.supportsCapability("CREATE_RELEASE")) {
      issues.push({
        code: "CAPABILITY_REQUIRED",
        field: "provider",
        message: "Provider CREATE_RELEASE yeteneğini desteklemiyor.",
        severity: "ERROR",
      });
    }

    const configuredCapabilities = new Set(runtimeConfiguration?.enabledCapabilities ?? []);
    if (
      runtimeConfiguration?.enabledCapabilities &&
      runtimeConfiguration.enabledCapabilities.length > 0 &&
      !configuredCapabilities.has("CREATE_RELEASE")
    ) {
      issues.push({
        code: "CAPABILITY_DISABLED",
        field: "provider.capabilities",
        message: "CREATE_RELEASE capability yapılandırmada etkin değil.",
        severity: "ERROR",
      });
    }

    issues.push(
      ...validateProviderCodeRules({
        payload,
        supportsAutoIsrc,
        supportsAutoUpc,
      }),
    );

    return issues.some((issue) => issue.severity === "ERROR")
      ? { success: false as const, issues }
      : { success: true as const, issues };
  }
}

export const distributionValidationService = new DistributionValidationService();
