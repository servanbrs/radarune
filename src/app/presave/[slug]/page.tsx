import { notFound } from "next/navigation";
import { PublicGrowthShell } from "@/features/growth/components/public-shell";
import { growthRepository } from "@/features/growth/server/repositories/growth.repository";

export default async function PreSavePublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const campaign = await growthRepository.findPreSaveBySlug(slug);
  if (!campaign || !campaign.active) {
    notFound();
  }

  return (
    <PublicGrowthShell>
      <section className="rounded-[2rem] border border-white/70 bg-white/80 p-8 shadow-xl backdrop-blur">
        <p className="text-xs uppercase tracking-[0.24em] text-muted">Pre-save</p>
        <h1 className="mt-3 text-4xl font-semibold">{campaign.name}</h1>
        <p className="mt-3 text-sm text-muted">{campaign.artist.name} · {campaign.release.title}</p>
        {campaign.description ? <p className="mt-6 text-sm leading-7 text-muted">{campaign.description}</p> : null}
        <div className="mt-8 rounded-3xl border border-line bg-white p-5">
          <p className="text-sm font-semibold">E-posta hatırlatma modu</p>
          <p className="mt-2 text-sm text-muted">
            Spotify ve Apple Music OAuth erişimi yapılandırılmadan başarı sonucu gösterilmez. Bu kampanya yalnızca açık rızalı e-posta hatırlatma modunda çalışır.
          </p>
        </div>
      </section>
    </PublicGrowthShell>
  );
}
