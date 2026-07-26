import { NextResponse } from "next/server";
import { providerWebhookService } from "@/features/distribution-hub/server/services/provider-webhook.service";

export async function POST(
  request: Request,
  context: {
    params: Promise<{
      provider: string;
    }>;
  },
) {
  const params = await context.params;
  const provider = params.provider.toUpperCase() as
    | "ONE_RPM"
    | "FUGA"
    | "SYMPHONIC"
    | "REVELATOR"
    | "INTERNAL";
  const body = await request.text();

  const headerEntries = Array.from(request.headers.entries());
  const headers = Object.fromEntries(headerEntries);

  const result = await providerWebhookService.handleWebhook(provider, body, headers);

  return NextResponse.json(result.data, {
    status: result.statusCode,
  });
}
