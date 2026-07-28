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
      <section id="smtp" className="panel mb-5 grid gap-4 p-6"><div><h2 className="text-lg font-semibold">SMTP ve e-posta ayarları</h2><p className="mt-1 text-sm text-muted">Kimlik bilgileri sunucu ortam değişkenlerinden okunur; parola hiçbir zaman tarayıcıya gönderilmez.</p></div><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-line bg-surface-strong p-4"><p className="text-xs uppercase tracking-[0.16em] text-muted">Durum</p><p className={`mt-2 font-semibold ${env.MAIL_PROVIDER === "SMTP" && env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USERNAME && env.SMTP_PASSWORD && env.SMTP_FROM_EMAIL ? "text-accent" : "text-danger"}`}>{env.MAIL_PROVIDER === "SMTP" && env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USERNAME && env.SMTP_PASSWORD && env.SMTP_FROM_EMAIL ? "SMTP aktif" : "Yapılandırma bekliyor"}</p></div><div className="rounded-xl border border-line bg-surface-strong p-4"><p className="text-xs uppercase tracking-[0.16em] text-muted">Sunucu</p><p className="mt-2 font-medium">{env.SMTP_HOST ?? "—"}{env.SMTP_PORT ? `:${env.SMTP_PORT}` : ""}</p></div></div><p className="rounded-xl border border-accent/20 bg-accent/5 p-4 text-sm">Production `.env` içine <code>MAIL_PROVIDER=SMTP</code>, <code>SMTP_HOST</code>, <code>SMTP_PORT</code>, <code>SMTP_USERNAME</code>, <code>SMTP_PASSWORD</code> ve <code>SMTP_FROM_EMAIL</code> ekleyip uygulamayı yeniden başlatın.</p></section><section className="panel mb-5 grid gap-3 p-6"><h2 className="text-lg font-semibold">E-posta ve webhook sağlık durumu</h2><div className="grid gap-3 md:grid-cols-2"><div className="rounded-xl border border-line bg-surface-strong p-4"><p className="text-xs uppercase tracking-[0.16em] text-muted">SMTP</p><p className={`mt-2 font-semibold ${env.MAIL_PROVIDER === "SMTP" && env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USERNAME && env.SMTP_PASSWORD && env.SMTP_FROM_EMAIL ? "text-accent" : "text-danger"}`}>{env.MAIL_PROVIDER === "SMTP" ? (env.SMTP_HOST ? "Yapılandırıldı" : "Eksik SMTP alanları") : "SMTP aktif değil"}</p></div><div className="rounded-xl border border-line bg-surface-strong p-4"><p className="text-xs uppercase tracking-[0.16em] text-muted">İletişim webhook</p><p className={`mt-2 font-semibold ${env.CONTACT_WEBHOOK_URL ? "text-accent" : "text-danger"}`}>{env.CONTACT_WEBHOOK_URL ? "Yapılandırıldı" : "Yapılandırılmadı"}</p></div></div></section><AdminSettingsForm settings={settings} />
    </AdminShell>
  );
}
