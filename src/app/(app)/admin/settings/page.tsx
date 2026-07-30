import { AdminShell } from "@/features/admin/components/admin-shell";
import { AdminSettingsForm } from "@/features/admin/components/admin-settings-form";
import { authSessionService } from "@/features/authentication/server/services/auth-session.service";
import { toAdminActor } from "@/features/admin/server/admin-context";
import { adminSystemService } from "@/features/admin/server/services/admin-system.service";
import { updateSmtpSettingsAction, testSmtpSettingsAction } from "@/features/admin/server/actions/admin-settings.actions";
import { getEmailSettings } from "@/features/email/server/email-settings.service";

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
  const emailSettings = await getEmailSettings(actor.organizationId);
  const setting = (key: string, fallback = "") => {
    const value = settings.find((item) => item.key === key)?.value;
    return value === undefined || value === null ? fallback : String(value);
  };
  const smtpConfigured = Boolean(emailSettings.host && emailSettings.port && emailSettings.username && emailSettings.password && emailSettings.fromEmail);

  return (
    <AdminShell
      title="Site ayarları"
      description="Radarune marka, üyelik, dağıtım, dosya yükleme ve bakım ayarlarını yönetin."
    >
      <section id="smtp" className="panel mb-5 grid gap-5 p-6">
        <div><h2 className="text-lg font-semibold">SMTP ve e-posta ayarları</h2><p className="mt-1 text-sm text-muted">SMTP bilgileri şifreli olarak saklanır. Doğrulama, hoş geldin ve şifre yenileme e-postalarını buradan düzenleyin.</p></div>
        <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-line bg-surface-strong p-4"><p className="text-xs uppercase tracking-[0.16em] text-muted">Durum</p><p className={`mt-2 font-semibold ${smtpConfigured ? "text-accent" : "text-danger"}`}>{smtpConfigured ? "SMTP aktif" : "Yapılandırma bekliyor"}</p></div><div className="rounded-xl border border-line bg-surface-strong p-4"><p className="text-xs uppercase tracking-[0.16em] text-muted">Sunucu</p><p className="mt-2 font-medium">{emailSettings.host || "—"}{emailSettings.host && emailSettings.port ? `:${emailSettings.port}` : ""}</p></div></div>
        <form action={updateSmtpSettingsAction} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2"><label className="text-sm font-medium">Sağlayıcı<select name="smtpProvider" defaultValue={setting("SMTP_MAIL_PROVIDER", "SMTP")} className="mt-2 w-full rounded-xl border border-line bg-surface-strong px-4 py-3"><option value="SMTP">SMTP</option></select></label><label className="text-sm font-medium">SMTP host<input name="smtpHost" defaultValue={setting("SMTP_HOST")} className="mt-2 w-full rounded-xl border border-line bg-surface-strong px-4 py-3" placeholder="smtp.example.com" required /></label><label className="text-sm font-medium">Port<input name="smtpPort" type="number" min="1" max="65535" defaultValue={setting("SMTP_PORT", "587")} className="mt-2 w-full rounded-xl border border-line bg-surface-strong px-4 py-3" required /></label><label className="text-sm font-medium">Kullanıcı adı<input name="smtpUsername" defaultValue={setting("SMTP_USERNAME")} className="mt-2 w-full rounded-xl border border-line bg-surface-strong px-4 py-3" required /></label><label className="text-sm font-medium">Parola<input name="smtpPassword" type="password" className="mt-2 w-full rounded-xl border border-line bg-surface-strong px-4 py-3" placeholder={setting("SMTP_PASSWORD") ? "•••••••• (değiştirmeyecekseniz boş bırakın)" : "SMTP parolası"} /></label><label className="text-sm font-medium">Gönderici e-posta<input name="smtpFromEmail" type="email" defaultValue={setting("SMTP_FROM_EMAIL")} className="mt-2 w-full rounded-xl border border-line bg-surface-strong px-4 py-3" placeholder="noreply@radarune.com" required /></label></div>
          <div className="grid gap-4 md:grid-cols-2"><label className="text-sm font-medium">Doğrulama konusu<input name="verificationSubject" defaultValue={setting("EMAIL_TEMPLATE_VERIFICATION_SUBJECT")} className="mt-2 w-full rounded-xl border border-line bg-surface-strong px-4 py-3" /></label><label className="text-sm font-medium">Hoş geldin konusu<input name="welcomeSubject" defaultValue={setting("EMAIL_TEMPLATE_WELCOME_SUBJECT")} className="mt-2 w-full rounded-xl border border-line bg-surface-strong px-4 py-3" /></label><label className="text-sm font-medium">Doğrulama içeriği<textarea name="verificationBody" defaultValue={setting("EMAIL_TEMPLATE_VERIFICATION_BODY")} className="mt-2 min-h-24 w-full rounded-xl border border-line bg-surface-strong px-4 py-3" /></label><label className="text-sm font-medium">Hoş geldin içeriği<textarea name="welcomeBody" defaultValue={setting("EMAIL_TEMPLATE_WELCOME_BODY")} className="mt-2 min-h-24 w-full rounded-xl border border-line bg-surface-strong px-4 py-3" /></label><label className="text-sm font-medium">Şifre yenileme konusu<input name="passwordResetSubject" defaultValue={setting("EMAIL_TEMPLATE_PASSWORD_RESET_SUBJECT")} className="mt-2 w-full rounded-xl border border-line bg-surface-strong px-4 py-3" /></label><label className="text-sm font-medium">Şifre yenileme içeriği<textarea name="passwordResetBody" defaultValue={setting("EMAIL_TEMPLATE_PASSWORD_RESET_BODY")} className="mt-2 min-h-24 w-full rounded-xl border border-line bg-surface-strong px-4 py-3" /></label></div>
          <label className="text-sm font-medium">Değişiklik sebebi<input name="reason" minLength={10} required className="mt-2 w-full rounded-xl border border-line bg-surface-strong px-4 py-3" placeholder="SMTP ve e-posta şablonlarını güncelledim" /></label><button className="w-fit rounded-full bg-accent px-5 py-3 font-semibold text-accent-foreground" type="submit">SMTP ve şablonları kaydet</button>
        </form>
        <form action={testSmtpSettingsAction} className="flex flex-wrap items-end gap-3 rounded-xl border border-accent/20 bg-accent/5 p-4"><label className="min-w-64 flex-1 text-sm font-medium">Test alıcısı<input name="testRecipient" type="email" required className="mt-2 w-full rounded-xl border border-line bg-surface-strong px-4 py-3" placeholder="test@example.com" /></label><button className="rounded-full border border-line px-5 py-3 font-semibold" type="submit">Bağlantıyı doğrula ve test gönder</button></form>
      </section><AdminSettingsForm settings={settings} />
    </AdminShell>
  );
}
