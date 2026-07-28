import { NextResponse } from "next/server";
import { providerWebhookService } from "@/features/distribution-hub/server/services/provider-webhook.service";
import { distributionProviderKeys, type DistributionProviderKey } from "@/features/distribution-hub/domain/provider";

export async function POST(
  request: Request,
  context: {
    params: Promise<{
      provider: string;
    }>;
  },
) {
  const params = await context.params;
  const candidate = params.provider.toUpperCase();
  if (!distributionProviderKeys.includes(candidate as DistributionProviderKey)) {
    return NextResponse.json({ error: "Bilinmeyen distribution provider." }, { status: 404 });
  }
  const provider = candidate as DistributionProviderKey;
  const body = await request.text();

  const headerEntries = Array.from(request.headers.entries());
  const headers = Object.fromEntries(headerEntries);

  const result = await providerWebhookService.handleWebhook(provider, body, headers);

  return NextResponse.json(result.data, {
    status: result.statusCode,
  });
}
