import "server-only";
import { integrationCredentialService } from "@/features/integrations/server/services/integration-credential.service";

export class WhatsAppNotificationService {
  async sendRelease(organizationId: string, input: { title: string; releaseId: string }) {
    const config = await integrationCredentialService.whatsapp(organizationId);
    if (!config) return { sent: 0, skipped: true };
    const recipients = (config.recipients ?? "").split(/[\n,]+/).map((item) => item.trim()).filter(Boolean);
    const url = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://radarune.com"}/releases/${input.releaseId}`;
    let sent = 0;
    for (const to of recipients) {
      const response = await fetch(`https://graph.facebook.com/v20.0/${config.phoneNumberId}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${config.accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ messaging_product: "whatsapp", to, type: "template", template: { name: config.templateName, language: { code: config.templateLanguage }, components: [{ type: "body", parameters: [{ type: "text", text: input.title }, { type: "text", text: url }] }] } }),
      });
      if (!response.ok) throw new Error(`WhatsApp gönderimi başarısız: ${response.status}`);
      sent += 1;
    }
    return { sent, skipped: false };
  }
}

export const whatsappNotificationService = new WhatsAppNotificationService();
