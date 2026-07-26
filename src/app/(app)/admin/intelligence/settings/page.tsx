import { AdminShell } from "@/features/admin/components/admin-shell";

export default function AdminIntelligenceSettingsPage() {
  return (
    <AdminShell title="AI ayarları" description="Provider credential, prompt ve kural yönetimi SUPER_ADMIN izinleriyle ayrı sayfalardan yapılır.">
      <section className="panel p-6">
        <h2 className="text-lg font-semibold">Güvenli yapılandırma</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
          Harici AI provider anahtarları kod içine yazılmaz ve istemciye gönderilmez. Provider yapılandırması tamamlanmadan AI analiz işleri
          CONFIGURATION_REQUIRED durumuyla sonlanır; deterministic validation ve readiness skorları ise provider bağımsız çalışır.
        </p>
      </section>
    </AdminShell>
  );
}
