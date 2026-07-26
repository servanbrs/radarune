import Link from "next/link";
import { notFound } from "next/navigation";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { toAdminActor } from "@/features/admin/server/admin-context";
import { preSaveService } from "@/features/growth/server/services/presave.service";

export default async function PreSaveDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { organization, user } = await authSessionService.getDashboardContext();
  const actor = toAdminActor({ organizationId: organization.organization.id, membershipRole: organization.role, systemRole: user.systemRole, userId: user.id });
  const campaign = await preSaveService.getById(actor, id);
  if (!campaign) notFound();

  return (
    <main className="page-shell">
      <section className="panel p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.24em] text-muted">Pre-save</p>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-3xl font-semibold">{campaign.name}</h1><p className="mt-2 text-sm text-muted">/{campaign.slug} · {campaign.artist.name} · {campaign.release.title}</p></div><span className="rounded-full border border-line px-3 py-1 text-xs font-semibold">{campaign.active ? "Aktif" : "Taslak"}</span></div>
        {campaign.description ? <p className="mt-6 max-w-2xl leading-7 text-muted">{campaign.description}</p> : null}
        <div className="mt-8 grid gap-4 sm:grid-cols-3"><article className="rounded-2xl border border-line bg-surface p-4"><p className="text-xs uppercase tracking-[0.18em] text-muted">Abone</p><p className="mt-2 text-2xl font-semibold">{campaign._count.subscribers}</p></article><article className="rounded-2xl border border-line bg-surface p-4"><p className="text-xs uppercase tracking-[0.18em] text-muted">Dönüşüm</p><p className="mt-2 text-2xl font-semibold">{campaign._count.conversions}</p></article><article className="rounded-2xl border border-line bg-surface p-4"><p className="text-xs uppercase tracking-[0.18em] text-muted">Yayın tarihi</p><p className="mt-2 text-lg font-semibold">{campaign.releaseDate.toLocaleDateString("tr-TR")}</p></article></div>
      </section>
      <section className="panel p-6"><div className="flex flex-wrap items-center justify-between gap-4"><h2 className="text-lg font-semibold">Kampanya ayarları</h2><Link className="text-sm font-semibold text-accent" href={`/presave/${campaign.slug}`}>Public sayfayı aç</Link></div><dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><div className="rounded-2xl border border-line p-4"><dt className="text-muted">Başlangıç</dt><dd className="mt-1 font-semibold">{campaign.startDate.toLocaleDateString("tr-TR")}</dd></div><div className="rounded-2xl border border-line p-4"><dt className="text-muted">Bitiş</dt><dd className="mt-1 font-semibold">{campaign.endDate.toLocaleDateString("tr-TR")}</dd></div><div className="rounded-2xl border border-line p-4"><dt className="text-muted">E-posta toplama</dt><dd className="mt-1 font-semibold">{campaign.emailCaptureEnabled ? "Açık" : "Kapalı"}</dd></div><div className="rounded-2xl border border-line p-4"><dt className="text-muted">Sağlayıcı</dt><dd className="mt-1 font-semibold">{campaign.providers.map((provider) => provider.provider).join(", ") || "Yapılandırılmadı"}</dd></div></dl></section>
    </main>
  );
}
