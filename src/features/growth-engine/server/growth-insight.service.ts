import "server-only";

import { assertAdminPermission } from "@/features/admin/server/admin-context";
import { adminSystemService } from "@/features/admin/server/services/admin-system.service";
import { aiProviderRegistry } from "@/features/intelligence/server/adapters/ai-provider-registry";
import type { FinanceActorContext } from "@/features/finance/server/services/finance-access.service";
import { prisma } from "@/server/prisma/prisma";

export type GrowthMetrics = {
  periodDays: number;
  newUsers: number;
  artists: number;
  releases: number;
  pendingApplications: number;
  releaseVotes: number;
  artistFollows: number;
  smartLinkViews: number;
  smartLinkClicks: number;
};

export type GrowthAction = {
  actionKey: "SMART_LINK_CRO" | "WEEKLY_SHARE_CARD" | "SOCIAL_AUTOMATION" | "ARTIST_ONBOARDING" | "REFERRAL_RULES";
  title: string;
  channel: string;
  priority: "Yüksek" | "Orta" | "Düşük";
  reason: string;
  nextStep: string;
  targetUrl: string;
  canApply: boolean;
};

export type GrowthPlan = {
  summary: string;
  actions: GrowthAction[];
  source: "OPENAI" | "KURAL MOTORU";
  metrics: GrowthMetrics;
};

export class GrowthInsightService {
  async getMetrics(organizationId: string, periodDays = 30): Promise<GrowthMetrics> {
    const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
    const newUsers = await prisma.user.count({ where: { createdAt: { gte: since } } });
    const artists = await prisma.artist.count({ where: { organizationId } });
    const releases = await prisma.release.count({ where: { organizationId } });
    const pendingApplications = await prisma.artistApplication.count({ where: { organizationId, status: { in: ["PENDING", "UNDER_REVIEW", "REVISION_REQUESTED"] } } });
    const releaseVotes = await prisma.releaseLike.count({ where: { organizationId, createdAt: { gte: since } } });
    const artistFollows = await prisma.follow.count({ where: { organizationId, createdAt: { gte: since } } });
    const smartLinkViews = await prisma.smartLinkView.count({ where: { organizationId, createdAt: { gte: since }, isBot: false } });
    const smartLinkClicks = await prisma.smartLinkClick.count({ where: { organizationId, createdAt: { gte: since } } });

    return { periodDays, newUsers, artists, releases, pendingApplications, releaseVotes, artistFollows, smartLinkViews, smartLinkClicks };
  }

  async createPlan(actor: FinanceActorContext): Promise<GrowthPlan> {
    assertAdminPermission(actor, "admin.intelligence.view");
    const metrics = await this.getMetrics(actor.organizationId);
    const provider = aiProviderRegistry.get("OPENAI");
    const result = await provider.analyzeText({
      text: `Radarune için gerçek kullanıcı kazanım planı üret. Sahte kullanıcı, sahte etkileşim veya izinsiz reklam yok. Aynı başlıkları ve aynı görev sırasını tekrar etme; bu planın üretim zamanı ${new Date().toISOString()} ve plan rotasyonu ${Math.floor(Date.now() / 604800000)}. Metriklerdeki en büyük fırsatı öncele. Smart Link dönüşümünü artırmak için başlık, açıklama ve çağrı butonu testleri öner. Ayrıca admin onaylı Facebook, Instagram ve X duyuru akışı için paylaşım metni ve UTM planı üret; gerçek otomatik paylaşım için bağlı platform hesabı veya webhook gerektiğini belirt. Yalnızca adminin onaylayacağı SEO, referral, presave, sanatçı onboarding, içerik ve e-posta görevleri öner. Türkçe JSON döndür: {summary:string,actions:Array<{actionKey:"SMART_LINK_CRO"|"WEEKLY_SHARE_CARD"|"SOCIAL_AUTOMATION"|"ARTIST_ONBOARDING"|"REFERRAL_RULES",title:string,channel:string,priority:"Yüksek"|"Orta"|"Düşük",reason:string,nextStep:string}>}. En fazla 5 farklı görev. Veriler: ${JSON.stringify(metrics)}`,
    });

    const parsed = result.success ? this.normalize(result.data.structuredResult) : null;
    return {
      summary: parsed?.summary ?? this.fallbackSummary(metrics),
      actions: parsed?.actions?.length ? parsed.actions : this.fallbackActions(metrics),
      source: parsed ? "OPENAI" : "KURAL MOTORU",
      metrics,
    };
  }

  private normalize(value: unknown): { summary: string; actions: GrowthAction[] } | null {
    if (!value || typeof value !== "object") return null;
    const candidate = value as { summary?: unknown; actions?: unknown };
    if (typeof candidate.summary !== "string" || !Array.isArray(candidate.actions)) return null;
    const actions: GrowthAction[] = candidate.actions.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const action = item as Record<string, unknown>;
      if (["actionKey", "title", "channel", "priority", "reason", "nextStep"].some((key) => typeof action[key] !== "string")) return [];
      const actionKey = action.actionKey;
      if (!["SMART_LINK_CRO", "WEEKLY_SHARE_CARD", "SOCIAL_AUTOMATION", "ARTIST_ONBOARDING", "REFERRAL_RULES"].includes(String(actionKey))) return [];
      const priority: GrowthAction["priority"] = action.priority === "Yüksek" || action.priority === "Orta" || action.priority === "Düşük" ? action.priority : "Orta";
      const destinations: Record<GrowthAction["actionKey"], { targetUrl: string; canApply: boolean }> = {
        SMART_LINK_CRO: { targetUrl: "/admin/smart-links", canApply: false },
        WEEKLY_SHARE_CARD: { targetUrl: "/admin/growth/weekly-picks", canApply: false },
        SOCIAL_AUTOMATION: { targetUrl: "/admin/webhooks", canApply: false },
        ARTIST_ONBOARDING: { targetUrl: "/admin/applications", canApply: false },
        REFERRAL_RULES: { targetUrl: "/admin/settings", canApply: true },
      };
      return [{ actionKey: actionKey as GrowthAction["actionKey"], title: String(action.title).slice(0, 160), channel: String(action.channel).slice(0, 80), priority, reason: String(action.reason).slice(0, 500), nextStep: String(action.nextStep).slice(0, 500), ...destinations[actionKey as GrowthAction["actionKey"]] }];
    }).filter((action, index, all) => all.findIndex((candidate) => candidate.actionKey === action.actionKey) === index).slice(0, 5);
    return { summary: candidate.summary.slice(0, 800), actions };
  }

  private fallbackSummary(metrics: GrowthMetrics) {
    if (metrics.smartLinkViews > 0 && metrics.smartLinkClicks / metrics.smartLinkViews < 0.1) return "Smart Link görüntüleniyor ancak tıklama dönüşümü düşük; sayfa metni ve çağrı butonları iyileştirilmeli.";
    if (metrics.pendingApplications > 0) return "Bekleyen sanatçı başvuruları onboarding dönüşümünü etkiliyor; hızlı inceleme ve geri bildirim akışı önceliklendirilmeli.";
    return "Radarune’un organik keşif, sanatçı onboarding ve paylaşılabilir içerik kanallarını ölçerek büyütmesi için uygulanabilir görevler hazırlandı.";
  }

  private fallbackActions(metrics: GrowthMetrics): GrowthAction[] {
    const actions: GrowthAction[] = [
      { actionKey: "SMART_LINK_CRO", targetUrl: "/admin/smart-links", canApply: false, title: "Smart Link dönüşümünü iyileştir", channel: "Smart Link + CRO", priority: "Yüksek", reason: "Görüntülenme ile platform tıklaması arasındaki fark yüksekse ilk ekrandaki mesaj ve çağrı butonları güçlendirilmelidir.", nextStep: "Başlıkta sanatçı ve şarkı vaadini netleştir; ‘Şimdi dinle’ butonunu ilk ekrana taşı; Spotify ve YouTube tıklamalarını UTM ile karşılaştır." },
      { actionKey: "WEEKLY_SHARE_CARD", targetUrl: "/admin/growth/weekly-picks", canApply: false, title: "Haftalık Hype paylaşım paketi hazırla", channel: "Hype + sosyal paylaşım", priority: "Yüksek", reason: "Topluluk oylaması keşif için doğal içerik üretir.", nextStep: "Admin panelinde haftanın ilk 5 yayınını seç, paylaşım kartını oluştur ve admin onayına gönder." },
      { actionKey: "SOCIAL_AUTOMATION", targetUrl: "/admin/webhooks", canApply: false, title: "Yayın duyuru otomasyonunu bağla", channel: "Facebook · Instagram · X", priority: "Orta", reason: "Yayınlandığında tek bir duyuru metni ve kısa Radarune bağlantısı üretilebilir; platform izinleri olmadan doğrudan paylaşım yapılamaz.", nextStep: "release.published olayını bağlı webhook veya sosyal yayın aracına bağla; platform tokenlarını yetkilendir." },
      { actionKey: "ARTIST_ONBOARDING", targetUrl: "/admin/applications", canApply: false, title: "Sanatçı onboarding çağrısı yayınla", channel: "SEO + sanatçı profili", priority: "Orta", reason: "Yeni sanatçı profilleri hem içerik hem arama görünürlüğü oluşturur.", nextStep: "Doğrulanmış sanatçı başvuru sayfasına Smart Link ve profil örnekleri ekle." },
      { actionKey: "REFERRAL_RULES", targetUrl: "/admin/settings", canApply: true, title: "Referral kampanyası kuralını tanımla", channel: "Referral", priority: "Orta", reason: "Gerçek kullanıcı davetini ölçmek için doğrulanmış hesap ve aktiflik şartı gerekir.", nextStep: "Ödül uygunluğunu e-posta doğrulama, 7 gün aktiflik ve bir gerçek etkileşim şartlarıyla etkinleştir." },
    ];
    if (metrics.smartLinkViews > 0 && metrics.smartLinkClicks === 0) actions.unshift({ actionKey: "SMART_LINK_CRO", targetUrl: "/admin/smart-links", canApply: false, title: "Smart Link çağrı metnini test et", channel: "Smart Link", priority: "Yüksek", reason: "Görüntülenme var fakat tıklama yok.", nextStep: "Dinle, takip et ve ön kaydet butonlarını ilk ekranda görünür yap; UTM ile sonucu ölç." });
    const rotation = Math.floor(Date.now() / 604800000) % actions.length;
    return [...actions.slice(rotation), ...actions.slice(0, rotation)].slice(0, 5);
  }

  async applyAction(actor: FinanceActorContext, actionKey: GrowthAction["actionKey"]) {
    assertAdminPermission(actor, "admin.intelligence.view");
    if (actionKey !== "REFERRAL_RULES") {
      const targetUrl: Record<Exclude<GrowthAction["actionKey"], "REFERRAL_RULES">, string> = {
        SMART_LINK_CRO: "/admin/smart-links",
        WEEKLY_SHARE_CARD: "/admin/growth/weekly-picks",
        SOCIAL_AUTOMATION: "/admin/webhooks",
        ARTIST_ONBOARDING: "/admin/applications",
      };
      return { applied: false, targetUrl: targetUrl[actionKey], message: "Bu iş için gerekli Radarune ekranı açıldı; son yayınlama/onay adımı admin kontrolünde." };
    }
    const settings = [
      { key: "REWARD_EMAIL_VERIFICATION_REQUIRED", value: true },
      { key: "REWARD_MIN_ACTIVE_DAYS", value: 7 },
      { key: "REWARD_REAL_INTERACTION_REQUIRED", value: true },
    ] as const;
    for (const setting of settings) {
      await adminSystemService.updateSetting(actor, {
        ...setting,
        reason: "AI büyüme merkezinde admin onayıyla referral uygunluk kuralları etkinleştirildi.",
      });
    }
    return { applied: true, targetUrl: "/admin/settings", message: "Referral uygunluk kuralları etkinleştirildi: e-posta doğrulama, 7 gün aktiflik ve gerçek etkileşim." };
  }
}

export const growthInsightService = new GrowthInsightService();
