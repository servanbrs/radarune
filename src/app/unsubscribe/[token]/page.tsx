import { PublicGrowthShell } from "@/features/growth/components/public-shell";
import { preSaveService } from "@/features/growth/server/services/presave.service";

export default async function UnsubscribePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  await preSaveService.unsubscribe(token);
  return (
    <PublicGrowthShell>
      <section className="rounded-[2rem] border border-white/70 bg-white/80 p-8 text-center shadow-xl">
        <h1 className="text-3xl font-semibold">Abonelikten çıkıldı</h1>
        <p className="mt-3 text-sm text-muted">Bu pre-save hatırlatma listesinden güvenli şekilde çıkarıldınız.</p>
      </section>
    </PublicGrowthShell>
  );
}
