import { AdminShell } from "@/features/admin/components/admin-shell";
import { AdminSettingsForm } from "@/features/admin/components/admin-settings-form";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { toAdminActor } from "@/features/admin/server/admin-context";
import { adminSystemService } from "@/features/admin/server/services/admin-system.service";
import { env } from "@/lib/env";

export default async function AdminSettingsPage() {
  const { organization, user } =
    await authSessionService.getDashboardContext();

  const actor = toAdminActor({
    organizationId: organization.organization.id,
    membershipRole: organization.role,
    systemRole: user.systemRole,
    userId: user.id,
  });

  const settings =
    await adminSystemService.listSettings(actor);

  return (
    <AdminShell
      title="Site ayarları"
      description="Radarune marka, üyelik, dağıtım, dosya yükleme ve bakım ayarlarını yönetin."
    >
      <section className="panel mb-5 grid gap-3 p-6"><h2 className="text-lg font-semibold">E-posta ve webhook sağlık durumu</h2><div className="grid gap-3 md:grid-cols-2"><div className="rounded-xl border border-line bg-surface-strong p-4"><p className="text-xs uppercase tracking-[0.16em] text-muted">SMTP</p><p className={`mt-2 font-semibold ${env.MAIL_PROVIDER === "SMTP" && env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USERNAME && env.SMTP_PASSWORD && env.SMTP_FROM_EMAIL ? "text-accent" : "text-danger"}`}>{env.MAIL_PROVIDER === "SMTP" ? (env.SMTP_HOST ? "Yapılandırıldı" : "Eksik SMTP alanları") : "SMTP aktif değil"}</p><p className="mt-2 text-xs text-muted">MAIL_PROVIDER, SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, SMTP_FROM_EMAIL</p></div><div className="rounded-xl border border-line bg-surface-strong p-4"><p className="text-xs uppercase tracking-[0.16em] text-muted">İletişim webhook</p><p className={`mt-2 font-semibold ${env.CONTACT_WEBHOOK_URL ? "text-accent" : "text-danger"}`}>{env.CONTACT_WEBHOOK_URL ? "Yapılandırıldı" : "Yapılandırılmadı"}</p><p className="mt-2 text-xs text-muted">CONTACT_WEBHOOK_URL olmadan form sahte başarı vermez.</p></div></div></section><AdminSettingsForm settings={settings} />
    </AdminShell>
  );
}
