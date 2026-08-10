import { NextResponse } from "next/server";
import { integrationCredentialService } from "@/features/integrations/server/services/integration-credential.service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const config = await integrationCredentialService.whatsappWebhookConfig();
  if (mode === "subscribe" && token && challenge && config?.verifyToken && token === config.verifyToken) {
    return new Response(challenge, { status: 200, headers: { "content-type": "text/plain; charset=utf-8" } });
  }
  return NextResponse.json({ error: "WhatsApp webhook doğrulaması başarısız." }, { status: 403 });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  console.info("[RADARUNE_WHATSAPP_WEBHOOK] Meta olayı alındı", payload);
  return NextResponse.json({ received: true });
}
