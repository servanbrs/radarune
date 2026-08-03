import "server-only";

import { assertAdminPermission } from "@/features/admin/server/admin-context";
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
  title: string;
  channel: string;
  priority: "Yüksek" | "Orta" | "Düşük";
  reason: string;
  nextStep: string;
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
      text: `Radarune için gerçek kullanıcı kazanım planı üret. Sahte kullanıcı, sahte etkileşim, otomatik sosyal paylaşım veya izinsiz reklam yok. Yalnızca adminin onaylayacağı SEO, referral, presave, sanatçı onboarding, içerik ve e-posta görevleri öner. Türkçe JSON döndür: {summary:string,actions:Array<{title:string,channel:string,priority:"Yüksek"|"Orta"|"Düşük",reason:string,nextStep:string}>}. En fazla 5 görev. Veriler: ${JSON.stringify(metrics)}`,
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
      if (["title", "channel", "priority", "reason", "nextStep"].some((key) => typeof action[key] !== "string")) return [];
      const priority: GrowthAction["priority"] = action.priority === "Yüksek" || action.priority === "Orta" || action.priority === "Düşük" ? action.priority : "Orta";
      return [{ title: String(action.title).slice(0, 160), channel: String(action.channel).slice(0, 80), priority, reason: String(action.reason).slice(0, 500), nextStep: String(action.nextStep).slice(0, 500) }];
    }).slice(0, 5);
    return { summary: candidate.summary.slice(0, 800), actions };
  }

  private fallbackSummary(metrics: GrowthMetrics) {
    if (metrics.smartLinkViews > 0 && metrics.smartLinkClicks / metrics.smartLinkViews < 0.1) return "Smart Link görüntüleniyor ancak tıklama dönüşümü düşük; sayfa metni ve çağrı butonları iyileştirilmeli.";
    if (metrics.pendingApplications > 0) return "Bekleyen sanatçı başvuruları onboarding dönüşümünü etkiliyor; hızlı inceleme ve geri bildirim akışı önceliklendirilmeli.";
    return "Radarune’un organik keşif, sanatçı onboarding ve paylaşılabilir içerik kanallarını ölçerek büyütmesi için uygulanabilir görevler hazırlandı.";
  }

  private fallbackActions(metrics: GrowthMetrics): GrowthAction[] {
    const actions: GrowthAction[] = [
      { title: "Haftalık Hype paylaşım paketi hazırla", channel: "Hype + sosyal paylaşım", priority: "Yüksek", reason: "Topluluk oylaması keşif için doğal içerik üretir.", nextStep: "Admin panelinde haftanın ilk 5 yayınını seç, paylaşım kartını oluştur ve admin onayına gönder." },
      { title: "Sanatçı onboarding çağrısı yayınla", channel: "SEO + sanatçı profili", priority: "Orta", reason: "Yeni sanatçı profilleri hem içerik hem arama görünürlüğü oluşturur.", nextStep: "Doğrulanmış sanatçı başvuru sayfasına Smart Link ve profil örnekleri ekle." },
      { title: "Referral kampanyası kuralını tanımla", channel: "Referral", priority: "Orta", reason: "Gerçek kullanıcı davetini ölçmek için doğrulanmış hesap ve aktiflik şartı gerekir.", nextStep: "Ödülü hemen vermeden e-posta doğrulama, 7 gün aktiflik ve bir gerçek etkileşim şartlarını admin ayarına ekle." },
    ];
    if (metrics.smartLinkViews > 0 && metrics.smartLinkClicks === 0) actions.unshift({ title: "Smart Link çağrı metnini test et", channel: "Smart Link", priority: "Yüksek", reason: "Görüntülenme var fakat tıklama yok.", nextStep: "Dinle, takip et ve ön kaydet butonlarını ilk ekranda görünür yap; UTM ile sonucu ölç." });
    return actions.slice(0, 5);
  }
}

export const growthInsightService = new GrowthInsightService();
