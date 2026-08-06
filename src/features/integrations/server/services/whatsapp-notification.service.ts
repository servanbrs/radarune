import "server-only";
import { integrationCredentialService } from "@/features/integrations/server/services/integration-credential.service";

export class WhatsAppNotificationService {
  private async sendTemplate(config: Record<string, string>, to: string, parameters: string[]) {
    const response = await fetch(`https://graph.facebook.com/v20.0/${config.phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to, type: "template", template: { name: config.templateName, language: { code: config.templateLanguage }, components: [{ type: "body", parameters: parameters.map((text) => ({ type: "text", text })) }] } }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null) as { error?: { message?: string; code?: number; error_data?: { details?: string } } } | null;
      const metaError = body?.error;
      const detail = [metaError?.message, metaError?.error_data?.details].filter(Boolean).join(" — ");
      throw new Error(`WhatsApp gönderimi başarısız (${metaError?.code ?? response.status}): ${detail || "Meta API isteği reddetti."}`);
    }
  }

  async sendRelease(organizationId: string, input: { title: string; releaseId: string }) {
    const config = await integrationCredentialService.whatsapp(organizationId);
    if (!config) return { sent: 0, skipped: true };
    const recipients = (config.recipients ?? "").split(/[\n,]+/).map((item) => item.trim()).filter(Boolean);
    const url = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://radarune.com"}/releases/${input.releaseId}`;
    let sent = 0;
    for (const to of recipients) {
      await this.sendTemplate(config, to, [input.title, url]);
      sent += 1;
    }
    return { sent, skipped: false };
  }

  async sendTest(organizationId: string) {
    const config = await integrationCredentialService.whatsapp(organizationId);
    if (!config) throw new Error("WhatsApp entegrasyonu yapılandırılmamış.");
    const recipient = (config.recipients ?? "").split(/[\n,]+/).map((item) => item.trim()).find(Boolean);
    if (!recipient) throw new Error("Test için en az bir alıcı numarası ekleyin.");
    await this.sendTemplate(config, recipient, ["Radarune test mesajı", "WhatsApp bağlantısı çalışıyor."]);
    return { recipient };
  }
}

export const whatsappNotificationService = new WhatsAppNotificationService();
