import { distributionJson, withDistributionActor } from "@/features/distribution-hub/server/http/distribution-route";
import { distributionProviderConfigurationService } from "@/features/distribution-hub/server/services/provider-configuration.service";

export async function GET() {
  return withDistributionActor(async (actor) => {
    const configs = await distributionProviderConfigurationService.listByOrganization(actor);

    return distributionJson({
      success: true,
      data: configs,
    });
  });
}

export async function POST(request: Request) {
  return withDistributionActor(async (actor) => {
    const body = (await request.json()) as {
      provider: "ONE_RPM" | "FUGA" | "SYMPHONIC" | "REVELATOR" | "INTERNAL";
      isEnabled: boolean;
      environment: "SANDBOX" | "PRODUCTION";
      priority: number;
      maxRetryCount: number;
      timeoutSeconds: number;
      supportsAutoIsrc: boolean;
      supportsAutoUpc: boolean;
      supportsWebhooks: boolean;
      supportsUpdate: boolean;
      supportsTakedown: boolean;
      isDefault: boolean;
      displayName?: string;
      credentials?: Record<string, string>;
      webhookSecret?: string;
      publicMetadata?: Record<string, string>;
      enabledCapabilities?: Array<
        | "CREATE_RELEASE"
        | "UPDATE_RELEASE"
        | "TAKEDOWN"
        | "STATUS_SYNC"
        | "WEBHOOKS"
        | "ROYALTY_REPORTS"
        | "AUTO_ISRC"
        | "AUTO_UPC"
        | "CONTENT_ID"
        | "DOLBY_ATMOS"
        | "PRESAVE"
      >;
    };

    const result = await distributionProviderConfigurationService.upsert(actor, {
      provider: body.provider,
      isEnabled: body.isEnabled,
      environment: body.environment,
      priority: body.priority,
      maxRetryCount: body.maxRetryCount,
      timeoutSeconds: body.timeoutSeconds,
      supportsAutoIsrc: body.supportsAutoIsrc,
      supportsAutoUpc: body.supportsAutoUpc,
      supportsWebhooks: body.supportsWebhooks,
      supportsUpdate: body.supportsUpdate,
      supportsTakedown: body.supportsTakedown,
      isDefault: body.isDefault,
      ...(body.displayName ? { displayName: body.displayName } : {}),
      credentials: body.credentials ?? {},
      ...(body.webhookSecret ? { webhookSecret: body.webhookSecret } : {}),
      publicMetadata: body.publicMetadata ?? {},
      enabledCapabilities: body.enabledCapabilities ?? [],
    });

    return distributionJson(result, result.success ? 200 : 400);
  });
}
